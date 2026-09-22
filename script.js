'use strict';
 
(() => {
  const WHATSAPP = '5491138523271';
 
  /* =========================================================
     MÉTRICAS
     Registra cada clic que puede terminar en un turno.
     Funciona con Google Analytics 4 o Plausible si están instalados;
     si no hay ninguno, no hace nada.
     ========================================================= */
  function track(event, params = {}) {
    if (typeof window.gtag === 'function') window.gtag('event', event, params);
    if (typeof window.plausible === 'function') window.plausible(event, { props: params });
  }
 
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    const ubicacion = link.dataset.track || 'otro';
 
    if (href.includes('wa.me/')) track('click_whatsapp', { ubicacion });
    else if (href.startsWith('tel:')) track('click_telefono', { ubicacion });
    else if (href.startsWith('mailto:')) track('click_email', { ubicacion });
    else if (href.includes('google.com/maps')) track('click_como_llegar', { ubicacion });
  });
 
  /* =========================================================
     ENCABEZADO: línea inferior al hacer scroll
     ========================================================= */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
 
  /* =========================================================
     MENÚ MÓVIL
     ========================================================= */
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('menu');
 
  if (toggle && nav) {
    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
 
    toggle.addEventListener('click', () => {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
 
    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) setOpen(false);
    });
 
    document.addEventListener('click', (e) => {
      if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) {
        setOpen(false);
      }
    });
 
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });
 
    window.matchMedia('(min-width: 901px)').addEventListener('change', (mq) => {
      if (mq.matches) setOpen(false);
    });
  }
 
  /* =========================================================
     LINK ACTIVO SEGÚN LA SECCIÓN VISIBLE
     (se activa la sección que cruza el centro de la pantalla,
     así funciona también con secciones más altas que la pantalla)
     ========================================================= */
  const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
  const targets = navLinks
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);
 
  if ('IntersectionObserver' in window && targets.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = `#${entry.target.id}`;
        navLinks.forEach((a) => {
          if (a.getAttribute('href') === id) a.setAttribute('aria-current', 'location');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
 
    targets.forEach((t) => spy.observe(t));
  }
 
  /* =========================================================
     CARRUSELES DE CONSULTORIOS
     Botones, puntos, flechas del teclado y deslizar con el dedo.
     ========================================================= */
  document.querySelectorAll('[data-carousel]').forEach((carousel) => {
    const track = carousel.querySelector('[data-track]');
    const slides = [...track.children];
    const prev = carousel.querySelector('[data-prev]');
    const next = carousel.querySelector('[data-next]');
    const dotsWrap = carousel.querySelector('[data-dots]');
    let index = 0;
 
    if (slides.length < 2) {
      prev?.remove();
      next?.remove();
      dotsWrap?.remove();
      return;
    }
 
    const dots = slides.map((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel__dot';
      dot.setAttribute('aria-label', `Ver foto ${i + 1} de ${slides.length}`);
      dot.addEventListener('click', () => go(i));
      dotsWrap.appendChild(dot);
      return dot;
    });
 
    function render() {
      track.style.transform = `translateX(${-index * 100}%)`;
 
      slides.forEach((slide, i) => {
        const active = i === index;
        slide.setAttribute('aria-hidden', String(!active));
        slide.querySelectorAll('button, a, video').forEach((el) => { el.tabIndex = active ? 0 : -1; });
      });
 
      dots.forEach((dot, i) => {
        if (i === index) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
 
      // Precarga la foto siguiente para que no aparezca en blanco
      const upcoming = slides[(index + 1) % slides.length].querySelector('img[loading="lazy"]');
      if (upcoming) upcoming.loading = 'eager';
    }
 
    function go(i) {
      index = (i + slides.length) % slides.length;
      render();
    }
 
    prev?.addEventListener('click', () => go(index - 1));
    next?.addEventListener('click', () => go(index + 1));
 
    carousel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') go(index - 1);
      if (e.key === 'ArrowRight') go(index + 1);
    });
 
    // Deslizar con el dedo (o arrastrar con el mouse)
    let startX = null;
    let swiped = false;
 
    track.addEventListener('pointerdown', (e) => {
      startX = e.clientX;
      swiped = false;
    });
    track.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 40) {
        swiped = true;
        go(index + (dx < 0 ? 1 : -1));
      }
      startX = null;
    });
    track.addEventListener('pointercancel', () => { startX = null; });
 
    // Si fue un deslizamiento, que no abra el visor
    track.addEventListener('click', (e) => {
      if (swiped) {
        e.preventDefault();
        e.stopPropagation();
        swiped = false;
      }
    }, true);
 
    render();
  });
 
  /* =========================================================
     VISOR DE FOTOS Y VIDEOS
     ========================================================= */
  const dialog = document.getElementById('lightbox');
  const content = dialog?.querySelector('[data-content]');
  let lastTrigger = null;
 
  function openLightbox(trigger) {
    const { lightbox: type, src, poster } = trigger.dataset;
    if (!src) return;
 
    if (!dialog || typeof dialog.showModal !== 'function') {
      window.open(src, '_blank');
      return;
    }
 
    content.replaceChildren();
 
    if (type === 'video') {
      const video = document.createElement('video');
      video.src = src;
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      if (poster) video.poster = poster;
      content.append(video);
    } else {
      const img = document.createElement('img');
      img.src = src;
      img.alt = trigger.querySelector('img')?.alt || '';
      content.append(img);
    }
 
    lastTrigger = trigger;
    dialog.showModal();
  }
 
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-lightbox]');
    if (trigger) openLightbox(trigger);
  });
 
  if (dialog) {
    dialog.addEventListener('click', (e) => {
      // Cierra al tocar el fondo oscuro o la X
      if (e.target === dialog || e.target.closest('[data-close]')) dialog.close();
    });
    dialog.addEventListener('close', () => {
      content.querySelector('video')?.pause();
      content.replaceChildren();
      lastTrigger?.focus();
    });
  }
 
  /* =========================================================
     MAPAS BAJO DEMANDA
     El mapa de Google pesa bastante; solo se carga si la persona
     toca "Ver mapa". Así la página abre mucho más rápido.
     ========================================================= */
  document.querySelectorAll('[data-map-toggle]').forEach((btn) => {
    const box = document.getElementById(btn.getAttribute('aria-controls'));
    if (!box) return;
 
    btn.addEventListener('click', () => {
      const show = box.hidden;
 
      if (show && !box.querySelector('iframe')) {
        const iframe = document.createElement('iframe');
        iframe.src = btn.dataset.mapSrc;
        iframe.title = btn.dataset.mapTitle || 'Mapa';
        iframe.loading = 'lazy';
        iframe.referrerPolicy = 'no-referrer-when-downgrade';
        iframe.allowFullscreen = true;
        box.append(iframe);
      }
 
      box.hidden = !show;
      btn.setAttribute('aria-expanded', String(show));
      btn.textContent = show ? 'Ocultar mapa' : 'Ver mapa';
    });
  });
 
  /* =========================================================
     FORMULARIO → WHATSAPP
     Arma el mensaje con los datos elegidos y abre el chat.
     "Vi tu web" en el mensaje le permite a Karina saber
     cuántas consultas llegan desde la página.
     ========================================================= */
  const form = document.getElementById('form-turno');
 
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
 
      const nombre = form.querySelector('#f-nombre').value.trim();
      const tratamiento = form.querySelector('#f-tratamiento').value;
      const sede = form.querySelector('#f-sede').value;
      const extra = form.querySelector('#f-mensaje').value.trim();
 
      const lineas = [
        `Hola Karina${nombre ? `, soy ${nombre}` : ''}. Vi tu web y quiero sacar un turno.`,
        `Me interesa: ${tratamiento}.`,
        `Consultorio: ${sede}.`,
      ];
      if (extra) lineas.push(extra);
 
      const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lineas.join('\n'))}`;
      track('click_whatsapp', { ubicacion: 'formulario', tratamiento });
 
      const win = window.open(url, '_blank');
      if (win) win.opener = null;
      else window.location.href = url;
    });
  }
 
  /* =========================================================
     AÑO DEL PIE (se actualiza solo)
     ========================================================= */
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
})();

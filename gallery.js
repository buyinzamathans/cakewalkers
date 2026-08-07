/* =========================================================
   CAKE WALKERS — GALLERY INTERACTIONS
   Vanilla JS, no dependencies. Progressive & keyboard accessible.
   ========================================================= */
(function () {
    'use strict';

    var WA_NUMBER = '256777690441';
    var items = (typeof GALLERY_ITEMS !== 'undefined') ? GALLERY_ITEMS : [];
    var categories = (typeof GALLERY_CATEGORIES !== 'undefined') ? GALLERY_CATEGORIES : [];

    var grid = document.getElementById('galleryGrid');
    var filterBar = document.getElementById('filterBar');
    var statsEl = document.getElementById('galleryStats');
    var nav = document.getElementById('siteNav');

    var currentFilter = 'all';
    var visibleItems = items.slice(); // items matching current filter, in display order

    /* ---------- Nav scroll state ---------- */
    if (nav) {
        window.addEventListener('scroll', function () {
            nav.classList.toggle('is-scrolled', window.scrollY > 40);
        }, { passive: true });
    }

    /* ---------- Stats ---------- */
    function renderStats() {
        if (!statsEl) return;
        var html = '';
        html += '<div class="gallery-stat"><span class="stat-num">' + items.length + '</span><span class="stat-label">Creations</span></div>';
        html += '<div class="gallery-stat-divider"></div>';
        html += '<div class="gallery-stat"><span class="stat-num">' + categories.length + '</span><span class="stat-label">Collections</span></div>';
        html += '<div class="gallery-stat-divider"></div>';
        html += '<div class="gallery-stat"><span class="stat-num">1</span><span class="stat-label">Kitchen</span></div>';
        statsEl.innerHTML = html;
    }

    /* ---------- Filter chips ---------- */
    function renderFilterBar() {
        if (!filterBar) return;
        var html = '';
        html += chipHtml('all', 'All Creations', items.length, true);
        categories.forEach(function (cat) {
            html += chipHtml(cat.key, cat.label, cat.count, false);
        });
        filterBar.innerHTML = html;

        filterBar.querySelectorAll('.filter-chip').forEach(function (btn) {
            btn.addEventListener('click', function () {
                setFilter(btn.getAttribute('data-filter'));
            });
        });
    }

    function chipHtml(key, label, count, active) {
        return '<button type="button" class="filter-chip' + (active ? ' is-active' : '') + '" data-filter="' + key + '" role="tab" aria-selected="' + (active ? 'true' : 'false') + '">' +
            label + ' <span class="chip-count">' + count + '</span></button>';
    }

    function setFilter(key) {
        if (key === currentFilter) return;
        currentFilter = key;

        filterBar.querySelectorAll('.filter-chip').forEach(function (btn) {
            var active = btn.getAttribute('data-filter') === key;
            btn.classList.toggle('is-active', active);
            btn.setAttribute('aria-selected', active ? 'true' : 'false');
        });

        applyFilter();
    }

    function applyFilter() {
        var tiles = grid.querySelectorAll('.tile');
        visibleItems = [];
        tiles.forEach(function (tile) {
            var cat = tile.getAttribute('data-category');
            var match = (currentFilter === 'all' || cat === currentFilter);
            tile.classList.toggle('is-hidden', !match);
            if (match) {
                visibleItems.push(items[parseInt(tile.getAttribute('data-index'), 10)]);
                // re-trigger reveal for newly shown tiles
                if (!tile.classList.contains('in-view')) {
                    requestAnimationFrame(function () {
                        tile.classList.add('in-view');
                    });
                }
            }
        });
    }

    /* ---------- Grid render ---------- */
    function renderGrid() {
        if (!grid) return;
        var html = '';
        items.forEach(function (item, idx) {
            html += tileHtml(item, idx);
        });
        grid.innerHTML = html;

        grid.querySelectorAll('.tile').forEach(function (tile) {
            tile.addEventListener('click', function () {
                var idx = parseInt(tile.getAttribute('data-index'), 10);
                openLightbox(items[idx]);
            });
            tile.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    var idx = parseInt(tile.getAttribute('data-index'), 10);
                    openLightbox(items[idx]);
                }
            });
        });

        observeTiles();
    }

    function tileHtml(item, idx) {
        return (
            '<figure class="tile" data-category="' + item.category + '" data-index="' + idx + '" data-id="' + item.id + '" tabindex="0" role="button" aria-label="View ' + item.categoryLabel + ' photo ' + idx + '">' +
                '<div class="tile-frame">' +
                    '<img src="' + item.thumb + '" alt="' + item.categoryLabel + ' by Cake Walkers" loading="lazy" width="' + item.w + '" height="' + item.h + '">' +
                '</div>' +
                '<div class="tile-seal" aria-hidden="true">' +
                    '<svg viewBox="0 0 24 24" fill="#dbaf54" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>' +
                '</div>' +
                '<div class="tile-overlay">' +
                    '<div class="tile-caption">' +
                        '<span class="tile-cat">' + item.categoryLabel + '</span>' +
                        '<span class="tile-num">No. ' + String(idx + 1).padStart(2, '0') + '</span>' +
                    '</div>' +
                '</div>' +
            '</figure>'
        );
    }

    /* ---------- Scroll reveal ---------- */
    var io = null;
    function observeTiles() {
        if (io) io.disconnect();
        if (!('IntersectionObserver' in window)) {
            grid.querySelectorAll('.tile').forEach(function (t) { t.classList.add('in-view'); });
            return;
        }
        io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry, i) {
                if (entry.isIntersecting) {
                    var el = entry.target;
                    var delay = (i % 5) * 60;
                    setTimeout(function () { el.classList.add('in-view'); }, delay);
                    io.unobserve(el);
                }
            });
        }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });

        grid.querySelectorAll('.tile:not(.in-view)').forEach(function (t) { io.observe(t); });
    }

    /* ---------- Counter light (cursor glow) ---------- */
    var counterLight = document.getElementById('counterLight');
    if (counterLight && window.matchMedia('(hover: hover)').matches) {
        var rafId = null;
        var targetX = window.innerWidth / 2;
        var targetY = window.innerHeight / 3;
        var curX = targetX, curY = targetY;

        document.addEventListener('mousemove', function (e) {
            targetX = e.clientX;
            targetY = e.clientY + window.scrollY;
            counterLight.classList.add('is-active');
            if (!rafId) rafId = requestAnimationFrame(tick);
        }, { passive: true });

        function tick() {
            curX += (targetX - curX) * 0.12;
            curY += (targetY - curY) * 0.12;
            counterLight.style.transform = 'translate(' + curX + 'px, ' + (curY - window.scrollY) + 'px)';
            if (Math.abs(targetX - curX) > 0.5 || Math.abs(targetY - curY) > 0.5) {
                rafId = requestAnimationFrame(tick);
            } else {
                rafId = null;
            }
        }

        document.addEventListener('mouseleave', function () {
            counterLight.classList.remove('is-active');
        });
    }

    /* ---------- Lightbox ---------- */
    var lightbox = document.getElementById('lightbox');
    var lightboxImg = document.getElementById('lightboxImg');
    var lightboxEyebrow = document.getElementById('lightboxEyebrow');
    var lightboxTagline = document.getElementById('lightboxTagline');
    var lightboxCounter = document.getElementById('lightboxCounter');
    var lightboxWaBtn = document.getElementById('lightboxWaBtn');
    var lightboxClose = document.getElementById('lightboxClose');
    var lightboxPrev = document.getElementById('lightboxPrev');
    var lightboxNext = document.getElementById('lightboxNext');
    var lightboxBackdrop = document.getElementById('lightboxBackdrop');

    var activeIndexInVisible = 0;
    var lastFocusedEl = null;

    function openLightbox(item) {
        activeIndexInVisible = visibleItems.indexOf(item);
        if (activeIndexInVisible === -1) activeIndexInVisible = 0;
        lastFocusedEl = document.activeElement;
        renderLightbox();
        lightbox.classList.add('is-open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        lightboxClose.focus();
    }

    function closeLightbox() {
        lightbox.classList.remove('is-open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (lastFocusedEl) lastFocusedEl.focus();
    }

    function renderLightbox() {
        var item = visibleItems[activeIndexInVisible];
        if (!item) return;
        lightboxImg.src = item.src;
        lightboxImg.alt = item.categoryLabel + ' — Cake Walkers, Kampala';
        lightboxEyebrow.textContent = item.categoryLabel;
        lightboxTagline.textContent = categoryTagline(item.category);
        lightboxCounter.textContent = (activeIndexInVisible + 1) + ' / ' + visibleItems.length;
        var msg = "Hi! I'm browsing your gallery and I love this " + item.categoryLabel.toLowerCase() + " design (No. " + item.id + "). Could we talk about something similar?";
        lightboxWaBtn.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
        lightboxWaBtn.classList.add('is-visible');
    }

    function categoryTagline(key) {
        var found = categories.filter(function (c) { return c.key === key; })[0];
        return found ? found.tagline : '';
    }

    function showNext() {
        activeIndexInVisible = (activeIndexInVisible + 1) % visibleItems.length;
        renderLightbox();
    }

    function showPrev() {
        activeIndexInVisible = (activeIndexInVisible - 1 + visibleItems.length) % visibleItems.length;
        renderLightbox();
    }

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxBackdrop.addEventListener('click', closeLightbox);
    lightboxNext.addEventListener('click', showNext);
    lightboxPrev.addEventListener('click', showPrev);

    document.addEventListener('keydown', function (e) {
        if (!lightbox.classList.contains('is-open')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') showNext();
        if (e.key === 'ArrowLeft') showPrev();
    });

    /* Swipe support */
    var touchStartX = null;
    lightbox.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });
    lightbox.addEventListener('touchend', function (e) {
        if (touchStartX === null) return;
        var dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 50) {
            if (dx < 0) showNext(); else showPrev();
        }
        touchStartX = null;
    }, { passive: true });

    /* ---------- Init ---------- */
    renderStats();
    renderFilterBar();
    renderGrid();
})();

(function () {
	var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
	if (page === '') page = 'index.html';

	var englishPages = {
		'index-english.html': 1,
		'pictures.html': 1,
		'self-administration.html': 1,
		'history.html': 1,
		'contact.html': 1
	};
	var isEnglish = !!englishPages[page];

	var masterDE = 'index.html';
	var masterEN = 'index-english.html';
	var onMaster = page === masterDE || page === masterEN;

	// DE section -> EN section
	var deToEn = {
		'home': 'home',
		'selbstverwaltung': 'self-administration',
		'geschichte': 'history',
		'galerie': 'pictures',
		'kontakt': 'contact'
	};
	var enToDe = {};
	for (var k in deToEn) enToDe[deToEn[k]] = k;

	// [label, hash-id-on-master, href-fallback-for-non-master]
	var navDE = [
		['Home', 'home'],
		['Selbstverwaltung', 'selbstverwaltung'],
		['Geschichte', 'geschichte'],
		['Galerie', 'galerie'],
		['Kontakt', 'kontakt']
	];
	var navEN = [
		['Home', 'home'],
		['Self-administration', 'self-administration'],
		['History', 'history'],
		['Pictures', 'pictures'],
		['Contact', 'contact']
	];

	var items = isEnglish ? navEN : navDE;
	var master = isEnglish ? masterEN : masterDE;
	var otherMaster = isEnglish ? masterDE : masterEN;
	var hashMap = isEnglish ? enToDe : deToEn;

	var html = '<ul>';
	for (var i = 0; i < items.length; i++) {
		var label = items[i][0];
		var hash = items[i][1];
		var href;
		if (hash === null) {
			href = items[i][2];
		} else if (onMaster) {
			href = '#' + hash;
		} else {
			href = master + '#' + hash;
		}
		var dataAttr = hash ? ' data-section="' + hash + '"' : '';
		html += '<li' + dataAttr + '><a href="' + href + '">' + label + '</a></li>';
	}
	html += '</ul>';

	function setActive(sectionId) {
		var lis = document.querySelectorAll('#nav li[data-section]');
		for (var i = 0; i < lis.length; i++) {
			if (lis[i].getAttribute('data-section') === sectionId) {
				lis[i].classList.add('current');
			} else {
				lis[i].classList.remove('current');
			}
		}
		centerCurrent();
	}

	function centerCurrent() {
		// Skip on mobile — drawer uses block layout, no picker-wheel centering
		if (window.matchMedia('(max-width: 768px)').matches) return;
		var nav = document.getElementById('nav');
		if (!nav) return;
		var ul = nav.querySelector('ul');
		var cur = nav.querySelector('li.current');
		if (!ul || !cur) return;
		var ulRect = ul.getBoundingClientRect();
		var curRect = cur.getBoundingClientRect();
		var curOffsetInUl = (curRect.top - ulRect.top) + curRect.height / 2;
		var delta = ulRect.height / 2 - curOffsetInUl;
		ul.style.transform = 'translateY(' + delta.toFixed(1) + 'px)';
	}

	function updateLangSwitcher(sectionId) {
		var sw = document.getElementById('lang-switcher');
		if (!sw) return;
		var target = hashMap[sectionId] || hashMap['home'] || '';
		sw.href = otherMaster + (target ? '#' + target : '');
	}

	function initScrollspy() {
		if (!onMaster) return;
		var sections = document.querySelectorAll('section.scroll-section');
		if (!sections.length) return;

		function onScroll() {
			var y = window.scrollY || window.pageYOffset;
			var viewportMid = y + window.innerHeight * 0.3;
			var activeId = sections[0].id;
			for (var i = 0; i < sections.length; i++) {
				var s = sections[i];
				if (s.offsetTop <= viewportMid) activeId = s.id;
			}
			setActive(activeId);
			updateLangSwitcher(activeId);
		}

		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);
		onScroll();
	}

	function bindSmoothScroll() {
		if (!onMaster) return;
		var links = document.querySelectorAll('#nav a[href^="#"], #back-to-top');
		for (var i = 0; i < links.length; i++) {
			links[i].addEventListener('click', function (e) {
				var href = this.getAttribute('href');
				if (!href || href.charAt(0) !== '#') return;
				var id = href.slice(1);
				var el = document.getElementById(id);
				if (!el) return;
				e.preventDefault();
				el.scrollIntoView({ behavior: 'smooth', block: 'start' });
				if (history.pushState) history.pushState(null, '', '#' + id);
			});
		}
	}

	function injectLangSwitcher() {
		if (document.getElementById('lang-switcher')) return;
		var a = document.createElement('a');
		a.id = 'lang-switcher';
		a.textContent = isEnglish ? 'DE' : 'EN';
		a.setAttribute('aria-label', isEnglish ? 'Zur deutschen Version wechseln' : 'Switch to English');
		// Default target; scrollspy will refine with current section on master.
		var initialHash = location.hash ? location.hash.slice(1) : 'home';
		var target = hashMap[initialHash] || 'home';
		a.href = otherMaster + '#' + target;
		document.body.appendChild(a);
	}

	function injectHamburger() {
		if (!document.getElementById('nav-toggle')) {
			var btn = document.createElement('button');
			btn.id = 'nav-toggle';
			btn.type = 'button';
			btn.setAttribute('aria-label', isEnglish ? 'Toggle menu' : 'Menü umschalten');
			btn.setAttribute('aria-controls', 'nav');
			btn.setAttribute('aria-expanded', 'false');
			btn.innerHTML = '<span></span>';
			document.body.appendChild(btn);
		}
		if (!document.getElementById('nav-backdrop')) {
			var bd = document.createElement('div');
			bd.id = 'nav-backdrop';
			document.body.appendChild(bd);
		}
		var toggle = document.getElementById('nav-toggle');
		var backdrop = document.getElementById('nav-backdrop');
		function close() {
			document.body.classList.remove('nav-open');
			toggle.setAttribute('aria-expanded', 'false');
		}
		function open() {
			document.body.classList.add('nav-open');
			toggle.setAttribute('aria-expanded', 'true');
		}
		toggle.addEventListener('click', function () {
			if (document.body.classList.contains('nav-open')) close(); else open();
		});
		backdrop.addEventListener('click', close);
		// Close drawer after tapping a nav link on mobile
		var nav = document.getElementById('nav');
		if (nav) {
			nav.addEventListener('click', function (e) {
				var t = e.target;
				while (t && t !== nav) {
					if (t.tagName === 'A') { close(); return; }
					t = t.parentNode;
				}
			});
		}
		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape') close();
		});
	}

	function inject() {
		var nav = document.getElementById('nav');
		if (!nav) {
			nav = document.createElement('nav');
			nav.id = 'nav';
			document.body.insertBefore(nav, document.body.firstChild);
		}
		nav.innerHTML = html;
		injectLangSwitcher();
		injectHamburger();
		bindSmoothScroll();
		initScrollspy();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', inject);
	} else {
		inject();
	}
})();

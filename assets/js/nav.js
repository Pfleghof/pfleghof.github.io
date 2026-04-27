(function () {
	'use strict';

	const PAGE_DE = 'index.html';
	const PAGE_EN = 'index-english.html';

	// Single source of truth: each section has its DE/EN id + DE/EN label.
	const SECTIONS = [
		{ de: 'home',             en: 'home',                labelDE: 'Home',             labelEN: 'Home' },
		{ de: 'selbstverwaltung', en: 'self-administration', labelDE: 'Selbstverwaltung', labelEN: 'Self-administration' },
		{ de: 'geschichte',       en: 'history',             labelDE: 'Geschichte',       labelEN: 'History' },
		{ de: 'galerie',          en: 'pictures',            labelDE: 'Galerie',          labelEN: 'Pictures' },
		{ de: 'kontakt',          en: 'contact',             labelDE: 'Kontakt',          labelEN: 'Contact' }
	];

	const page = (location.pathname.split('/').pop() || PAGE_DE).toLowerCase();
	const isEnglish = page === PAGE_EN;
	const otherPage = isEnglish ? PAGE_DE : PAGE_EN;
	const idKey = isEnglish ? 'en' : 'de';
	const otherIdKey = isEnglish ? 'de' : 'en';
	const labelKey = isEnglish ? 'labelEN' : 'labelDE';

	// Map: section-id-on-this-page -> section-id-on-other-page
	const otherIdFor = {};
	for (const s of SECTIONS) otherIdFor[s[idKey]] = s[otherIdKey];

	// DOM refs cached after build
	let navItems = [];

	function buildNav() {
		let nav = document.getElementById('nav');
		if (!nav) {
			nav = document.createElement('nav');
			nav.id = 'nav';
			document.body.insertBefore(nav, document.body.firstChild);
		}
		const ul = document.createElement('ul');
		for (const s of SECTIONS) {
			const id = s[idKey];
			const li = document.createElement('li');
			li.dataset.section = id;
			const a = document.createElement('a');
			a.href = '#' + id;
			a.textContent = s[labelKey];
			li.appendChild(a);
			ul.appendChild(li);
		}
		nav.replaceChildren(ul);
		navItems = Array.from(ul.querySelectorAll('li[data-section]'));
	}

	function setActive(sectionId) {
		for (const li of navItems) {
			const isCurrent = li.dataset.section === sectionId;
			li.classList.toggle('current', isCurrent);
			const a = li.querySelector('a');
			if (a) {
				if (isCurrent) a.setAttribute('aria-current', 'location');
				else a.removeAttribute('aria-current');
			}
		}
		centerCurrent();
	}

	function centerCurrent() {
		const ul = document.querySelector('#nav ul');
		// On mobile drawer: clear any stale desktop transform and bail out.
		if (window.matchMedia('(max-width: 768px)').matches) {
			if (ul) ul.style.transform = '';
			return;
		}
		const cur = document.querySelector('#nav li.current');
		if (!ul || !cur) return;
		const ulRect = ul.getBoundingClientRect();
		const curRect = cur.getBoundingClientRect();
		const curMidInUl = (curRect.top - ulRect.top) + curRect.height / 2;
		const delta = ulRect.height / 2 - curMidInUl;
		ul.style.transform = `translateY(${delta.toFixed(1)}px)`;
	}

	function updateLangSwitcher(sectionId) {
		const sw = document.getElementById('lang-switcher');
		if (!sw) return;
		const target = otherIdFor[sectionId] || otherIdFor['home'];
		sw.href = `${otherPage}#${target}`;
	}

	function initScrollspy() {
		const sections = Array.from(document.querySelectorAll('section.scroll-section'));
		if (!sections.length) return;

		function onScroll() {
			const triggerY = window.scrollY + window.innerHeight * 0.3;
			let activeId = sections[0].id;
			for (const s of sections) {
				if (s.offsetTop <= triggerY) activeId = s.id;
			}
			setActive(activeId);
			updateLangSwitcher(activeId);
		}

		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);
		onScroll();
	}

	function bindSmoothScroll() {
		const links = document.querySelectorAll('#nav a[href^="#"], #back-to-top');
		for (const a of links) {
			a.addEventListener('click', (e) => {
				const href = a.getAttribute('href');
				if (!href || !href.startsWith('#')) return;
				const id = href.slice(1);
				const el = document.getElementById(id);
				if (!el) return;
				e.preventDefault();
				el.scrollIntoView({ behavior: 'smooth', block: 'start' });
				history.pushState(null, '', '#' + id);
			});
		}
	}

	function injectLangSwitcher() {
		if (document.getElementById('lang-switcher')) return;
		const a = document.createElement('a');
		a.id = 'lang-switcher';
		a.textContent = isEnglish ? 'DE' : 'EN';
		a.setAttribute('aria-label', isEnglish ? 'Zur deutschen Version wechseln' : 'Switch to English');
		const initialId = location.hash ? location.hash.slice(1) : 'home';
		a.href = `${otherPage}#${otherIdFor[initialId] || 'home'}`;
		document.body.appendChild(a);
	}

	function injectHamburger() {
		const toggle = document.createElement('button');
		toggle.id = 'nav-toggle';
		toggle.type = 'button';
		toggle.setAttribute('aria-label', isEnglish ? 'Toggle menu' : 'Menü umschalten');
		toggle.setAttribute('aria-controls', 'nav');
		toggle.setAttribute('aria-expanded', 'false');
		toggle.innerHTML = '<span></span>';

		const backdrop = document.createElement('div');
		backdrop.id = 'nav-backdrop';

		document.body.append(toggle, backdrop);

		const close = () => {
			document.body.classList.remove('nav-open');
			toggle.setAttribute('aria-expanded', 'false');
		};
		const open = () => {
			document.body.classList.add('nav-open');
			toggle.setAttribute('aria-expanded', 'true');
		};
		toggle.addEventListener('click', () => {
			document.body.classList.contains('nav-open') ? close() : open();
		});
		backdrop.addEventListener('click', close);

		// Close drawer after tapping any nav link.
		const nav = document.getElementById('nav');
		nav?.addEventListener('click', (e) => {
			if (e.target.closest('a')) close();
		});

		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') close();
		});
	}

	function init() {
		buildNav();
		injectLangSwitcher();
		injectHamburger();
		bindSmoothScroll();
		initScrollspy();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();

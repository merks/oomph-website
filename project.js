var eclipse_org_common = { "settings": { "cookies_class": { "name": "eclipse_settings", "enabled": 1 } } };

window.onscroll = function() {
	const footer = document.querySelector("#footer>div>a");
	footer.style.display = document.documentElement.scrollTop > 100 ? 'inline' : 'none';
};

const scriptBase = new URL(".", document.currentScript.src).href
const markdownBase = `${scriptBase}markdown/?file=`;
const selfHostedMarkdownBase = `${scriptBase}markdown/?f=`;
const newsBase = `${scriptBase}news/news.html?file=`;

let meta = toElements(`
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="shortcut icon" href="images/oomph-logo.svg"/>
`);

let defaultHeader = toElements(`
	<a href="https://www.eclipse.org/downloads/packages/">Eclipse IDE</a>
	<a href="https://eclipseide.org/working-group/">Working Group</a>
	<a href="https://eclipseide.org/release/noteworthy/">New &amp; Noteworthy</a>
	<a href="https://marketplace.eclipse.org/">Marketplace</a>
`);

let defaultBreadcrumb = toElements(`
	<a href="https://eclipseide.org/">Home</a>
	<a href="https://eclipseide.org/projects/">Projects</a>
`);

let defaultNav = toElements(`
<a class="fa-download" href="${scriptBase}?file=Eclipse_Installer.md"
	title="Download: Eclipse Installers">
	Download<p>Eclipse Installers</p>
</a>
<a class="fa-refresh" href="${scriptBase}#update-sites"
	title="Update: Sites">
	Updates<p>Sites</p>
</a>
<a class="fa-book" href="http://download.eclipse.org/oomph/help/" title="Documentation: Help Center">
	Documentation<p>&#x1F6A7; Help Center</p>
</a>
<a class="fa-users" href="${scriptBase}?file=Contribution_Guide.md"
	title="Contribution: Environment Setup">
	Contribution<p>Environment Setup</p>
</a>
<a class="fa-support" href="https://github.com/eclipse-oomph/oomph/discussions"
	title="Support: Discussions">
	Support<p>Discussions</p>
</a>
<a class="fa-bug" href="https://github.com/eclipse-oomph/oomph/issues"
	title="Issues: Bugs and Features">
	Issues<p>Bugs and Features</p>
</a>
`);

let projectAside = `
<a class="separator" href="https://projects.eclipse.org/projects/tools.oomph"><i class='fa fa-cube'></i> Oomph Project</a>
<a href="${scriptBase}?file=Eclipse_Installer.md">Eclipse Installer</a>
<a href="${scriptBase}?file=Authoring_Guide.md">Authoring Guide</a>
<a href="${scriptBase}?file=Targlets.md">Targlets</a>
<a href="${scriptBase}?file=Dynamic_Working_Sets.md">Dynamic Working Sets</a>
<a href="${scriptBase}?file=Repository_Analyzer.md">Repository Analyzer</a>
<a href="${scriptBase}?file=Eclipse_Installer_Marketplace.md">Marketplace</a>
<a href="${scriptBase}?file=Eclipse_Platform_SDK_Provisioning.md">Platform SDK Provisioning</a>
`;

let githubAside = `
<a class="separator" href="https://github.com/eclipse-oomph"><i class='fa fa fa-github'></i> GitHub</a>
<a href="https://github.com/eclipse-oomph/oomph">Oomph</a>
`;

let defaultAside = toElements(`
${projectAside}
${githubAside}
`);

let tableOfContentsAside = '';

function redirect(href) {
	const location = href != null ?
		`${href}${window.location.search}${window.location.hash}` :
		new URL(`${selfHostedMarkdownBase}${window.location.pathname.replace(/^\/eclipse\//, '').replace(/\/$/, '/index.html').replace(/\.html$/, '.md')}`);
	const body = document.querySelector('body')
	replaceChildren(body, "body", ...toElements(`<div style="display: none">If you are not redirected automatically, 	follow this <a href='${location}'>link</a>.</div>`));
	window.location = location;
}

function generate() {
	try {
		const head = document.head;
		var referenceNode = head.querySelector('script');
		for (const element of [...meta]) {
			head.insertBefore(element, referenceNode.nextElementSibling)
			referenceNode = element;
		}

		const generators = document.querySelectorAll('[data-generate]');
		for (const element of generators) {
			const generator = element.getAttribute('data-generate');
			const generate = new Function(generator);
			generate.call(element, element);
		}

		const generatedBody = generateBody();
		document.body.replaceChildren(...generatedBody);
	} catch (exception) {
		document.body.prepend(...toElements(`<span>Failed to generate content: <span><b style="color: FireBrick">${exception.message}</b><br/>`));
		console.log(exception);
	}
}

function generateDefaults(element, id) {
	if (id != null && getQueryParameter(id) != null) {
		return;
	}

	const parts = [];
	if (!hasElement('header')) {
		parts.push(generateDefaultHeader(document.createElement('div')));
	}
	if (!hasElement('breadcrumb')) {
		parts.push(generateDefaultBreadcrumb(document.createElement('div')));
	}
	if (!hasElement('aside')) {
		parts.push(generateDefaultAside(document.createElement('div')));
	}
	if (!hasElement('nav')) {
		parts.push(generateDefaultNav(document.createElement('div')));
	}
	element.prepend(...parts);
}

function generateBody() {
	const col = document.getElementById('aside') ? 'col-md-18' : ' col-md-24';
	return toElements(`
<div>
	${generateHeader()}
	<main id="content">
		<div class="novaContent container" id="novaContent">
			<div class="row">
				<div class="${col} main-col-content">
					<div class="novaContent" id="novaContent">
						<div class="row">
							${generateBreadcrumb()}
						</div>
						<div class=" main-col-content">
							${generateNav()}
							<div id="midcolumn">
							${generateMainContent()}
							</div>
						</div>
					</div>
				</div>
				${generateAside()}
				${tableOfContentsAside}
			</div>
		</div>
	</main>
	<footer id="footer">
		<div class="container">
			<div class="footer-sections row equal-height-md font-bold">
				<div id="footer-eclipse-foundation" class="footer-section col-md-5 col-sm-8">
					<div class="menu-heading">Eclipse Foundation</div>
					<ul class="nav">
						<ul class="nav">
							<li><a href="http://www.eclipse.org/org/">About</a></li>
							<li><a href="https://projects.eclipse.org/">Projects</a></li>
							<li><a href="http://www.eclipse.org/collaborations/">Collaborations</a></li>
							<li><a href="http://www.eclipse.org/membership/">Membership</a></li>
							<li><a href="http://www.eclipse.org/sponsor/">Sponsor</a></li>
						</ul>
					</ul>
				</div>
				<div id="footer-legal" class="footer-section col-md-5 col-sm-8">
					<div class="menu-heading">Legal</div>
					<ul class="nav">
						<ul class="nav">
							<li><a href="http://www.eclipse.org/legal/privacy.php">Privacy Policy</a></li>
							<li><a href="http://www.eclipse.org/legal/termsofuse.php">Terms of Use</a></li>
							<li><a href="http://www.eclipse.org/legal/compliance/">Compliance</a></li>
							<li><a href="http://www.eclipse.org/org/documents/Community_Code_of_Conduct.php">Code of
									Conduct</a></li>
							<li><a href="http://www.eclipse.org/legal/">Legal Resources</a></li>
						</ul>
					</ul>
				</div>
				<div id="footer-more" class="footer-section col-md-5 col-sm-8">
					<div class="menu-heading">More</div>
					<ul class="nav">
						<ul class="nav">
							<li><a href="http://www.eclipse.org/security/">Report a Vulnerability</a></li>
							<li><a href="https://www.eclipsestatus.io/">Service Status</a></li>
							<li><a href="http://www.eclipse.org/org/foundation/contact.php">Contact</a></li>
							<li><a href="http://www.eclipse.org//projects/support/">Support</a></li>
						</ul>
					</ul>
				</div>
			</div>
			<div class="col-sm-24">
				<div class="row">
					<div id="copyright" class="col-md-16">
						<p id="copyright-text">Copyright © Eclipse Foundation AISBL. All Rights Reserved.</p>
					</div>
				</div>
			</div>
			<a href="#" class="scrollup" onclick="scrollToTop()">Back to the top</a>
		</div>
	</footer>
</div>
`);
}

function generateMainContent() {
	const main = document.body.querySelector('main')
	if (main != null) {
		return main.outerHTML
	}
	return `
<main>The body specifies no content.</main>
`;
}

function generateDefaultHeader(element) {
	return prependChildren(element, 'header', ...defaultHeader);
}

function generateHeader() {
	const elements = document.querySelectorAll('#header>a');
	const items = Array.from(elements).map(link => {
		link.classList.add('link-unstyled');
		return `
<li class="navbar-nav-links-item">
	${link.outerHTML}
</li>
`;
	});
	const mobileItems = Array.from(elements).map(link => {
		link.className = 'mobile-menu-item mobile-menu-dropdown-toggle';
		return `
<li class="mobile-menu-dropdown">
	${link.outerHTML}
</li>
`;
	});

	return `
<header class="header-wrapper" id="header">
	<div class="header-navbar-wrapper">
		<div class="container">
			<div class="header-navbar">
				<a class="header-navbar-brand" href="https://eclipseide.org/">
					<div class="logo-wrapper">
						<img src="https://eclipse.dev/eclipse.org-common/themes/solstice/public/images/logo/eclipse-ide/eclipse_logo.svg" alt="Eclipse Project" width="150"/>
					</div>
				</a>
				<nav class="header-navbar-nav">
					<ul class="header-navbar-nav-links">
						${items.join('\n')}
					</ul>
				</nav>
				<div class="header-navbar-end">
					<div class="float-right hidden-xs" id="btn-call-for-action">
						<a href="https://www.eclipse.org/sponsor/ide/" class="btn btn-huge btn-warning">
							<i class="fa fa-star"></i> Sponsor
						</a>
					</div>
					<button class="mobile-menu-btn" onclick="toggleMenu()">
						<i class="fa fa-bars fa-xl"/></i>
					</button>
				</div>
			</div>
		</div>
	</div>
	<nav id="mobile-menu" class="mobile-menu hidden" aria-expanded="false">
		<ul>
			${mobileItems.join('\n')}
		</ul>
	</nav>
</header>
`;
}

function generateDefaultBreadcrumb(element) {
	return prependChildren(element, 'breadcrumb', ...defaultBreadcrumb);
}

function generateBreadcrumb() {
	const breadcumbs = document.getElementById('breadcrumb')
	if (breadcumbs == null) {
		return '';
	}

	const elements = breadcumbs.children;
	const items = Array.from(elements).map(link => `<li>${link.outerHTML}</li>`);

	const extraBreachcrumb = generateExtraBreadcrumb();
	if (extraBreachcrumb != null) {
		items.push(`<li>${extraBreachcrumb}</li>`);
	}

	return `
<section class="default-breadcrumbs hidden-print breadcrumbs-default-margin"
	id="breadcrumb">
	<div class="container">
		<h3 class="sr-only">Breadcrumbs</h3>
		<div class="row">
			<div class="col-sm-24">
				<ol class="breadcrumb">
					${items.join('\n')}
				</ol>
			</div>
		</div>
	</div>
</section>
`;
}

function generateExtraBreadcrumb() {
	const file = getQueryParameter('file');
	if (file != null) {
		const match = file.match(/[^\/]+/g);
		if (match.length == 1) {
			return `<span>${niceName(match[0])}</span>`;
		}
	}
}

function niceName(name) {
	return name.replaceAll(/\.md$/g, '').replaceAll(/[_-]/g, ' ').replaceAll(/([a-z])([A-Z])/g, '$1 $2').replace(/^([a-z])/, letter => letter.toLocaleUpperCase())
}

function generateDefaultNav(element) {
	return prependChildren(element, 'nav', ...defaultNav);
}

function generateNav() {
	const elements = document.body.querySelectorAll('#nav>a');
	if (elements.length == 0) {
		return '';
	}

	const items = Array.from(elements).map(element => {
		const href = element.getAttribute('href')
		const target = element.getAttribute('target') ?? "_self";
		const title = element.getAttribute('title') ?? '';
		const className = element.className ?? '';
		const content = element.innerHTML;
		return `
<li class="col-xs-24 col-md-12">
	<a class="row" href="${href}" title="${title}"
		target="${target}">
		<i class="col-xs-3 col-md-6 fa ${className}"></i>
		<span class="col-xs-21 c col-md-17">${content}
		</span>
	</a>
</li>
`;
	});

	return `
<div class="header_nav">
	<div class="col-xs-24 col-md-10 vcenter">
		<a href="${scriptBase}">
			<img src="${scriptBase}images/oomph-logo-with-title.svg" alt="The Main Index Page" xwidth="50%" xheight="auto" class="img-responsive header_nav_logo"/>
		</a>
	</div><!-- NO SPACES
 --><div class="col-xs-24 col-md-14 vcenter">
		<ul class="clearfix">
			${items.join('\n')}
		</ul>
	</div>
</div>
`;
}

function generateDefaultAside(element) {
	return prependChildren(element, 'aside', ...defaultAside);
}

function generateAside() {
	const elements = document.body.querySelectorAll('aside>*,#aside>*');
	if (elements.length == 0) {
		return '';
	}

	const items = Array.from(elements).map(element => {
		const main = element.classList.contains('separator')
		element.classList.add('link-unstyled');
		if (main) {
			element.classList.add('main-sidebar-heading');
			return `
<li class="main-sidebar-main-item main-sidebar-item-indented separator">
	${element.outerHTML}
</li>
`
		} else {
			return `
<li class="main-sidebar-item main-sidebar-item-indented">
	${element.outerHTML}
</li>
`
		}
	});

	return `
<div class="col-md-6 main-col-sidebar-nav">
	<aside class="main-sidebar-default-margin" id="main-sidebar">
		<ul class="ul-left-nav" id="leftnav" role="tablist" aria-multiselectable="true">
			${items.join('\n')}
	</aside>
</div>
`;
}

function hasElement(id) {
	return document.getElementById(id) != null;
}

function toElements(text) {
	const wrapper = document.createElement('div');
	wrapper.innerHTML = text;
	return wrapper.children
}

function replaceChildren(element, id, ...children) {
	element.id = id;
	element.replaceChildren(...children);
	return element;
}

function prependChildren(element, id, ...children) {
	element.id = id;
	element.prepend(...children);
	return element;
}

function addBase(htmlDocument, location) {
	const base = htmlDocument.createElement('base');
	base.href = location;
	htmlDocument.head.appendChild(base);
}

function getQueryParameter(id) {
	const location = new URL(window.location);
	const search = new URLSearchParams(location.search);
	return search.get(id);
}

function toggleMenu() {
	const mobileMenu = document.getElementById('mobile-menu')
	if (mobileMenu.classList.contains('hidden')) {
		mobileMenu.classList.remove('hidden');
	} else {
		mobileMenu.classList.add('hidden');
	}
}

function scrollToTop() {
	window.scrollTo({ top: 0, behavior: 'smooth' });
}

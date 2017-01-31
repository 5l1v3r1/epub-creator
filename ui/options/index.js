(function(global) { 'use strict'; define(({ // This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
	'node_modules/web-ext-utils/browser/version':  { current: currentBrowser, version: browserVersion, },
	'node_modules/web-ext-utils/options/editor': Editor,
	'common/options': options,
}) => {

window.options = options;

new Editor({
	options,
	host: document.querySelector('#options'),
});

const manifest = (global.browser || global.chrome).runtime.getManifest();

global.document.title = 'Options - '+ manifest.name;

set('title',               manifest.name);
set('version',             manifest.version);
set('license',             manifest.license);
set('author',              manifest.author);
set('repo',       'href',  manifest.repository.url);
set('appName',             currentBrowser.replace(/^./, c => c.toUpperCase()));
set('appVersion',          browserVersion);

if (manifest.contributions) {
	const about = document.querySelector('#about');
	const h3 = about.appendChild(document.createElement('h3'));
	h3.textContent = `Contributions`;
	manifest.contributions.forEach(({ what, who, license, }) => {
		if (!what) { return; }
		const line = about.appendChild(document.createElement('div'));
		line.style.margin = '3px 0';
		addLink(line, what);
		if (!who) { return; }
		line.appendChild(new Text(` by `));
		addLink(line, who);
		if (!license) { return; }
		line.appendChild(new Text(` (`));
		addLink(line, license);
		line.appendChild(new Text(`)`));
	});
}

function addLink(to, link) {
	const text = link.text || link; link = typeof link === 'object' && link.link || null;
	const _link = to.appendChild(document.createElement(link ? 'a' : 'span'));
	link && (_link.href = link) && (_link.target = '_blank');
	_link.textContent = text;
	return link;
}

function set(key, attr, value) {
	value = arguments[arguments.length - 1];
	attr = arguments.length > 2 ? attr : 'textContent';
	const element = global.document.querySelector('#'+ key);
	element && (element[attr] = value);
}

}); })(this);
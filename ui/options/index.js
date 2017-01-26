(function(global) { 'use strict'; define(({ // This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
	'node_modules/web-ext-utils/chrome/': { runtime, applications, },
	'node_modules/web-ext-utils/options/editor': Editor,
	'common/options': options,
}) => {

window.options = options;

new Editor({
	options,
	host: document.querySelector('#options'),
});

const manifest = runtime.getManifest();

global.document.title = 'Options - '+ manifest.name;

set('title',               manifest.name);
set('version',             manifest.version);
set('license',             manifest.license);
set('author',              manifest.author);
set('repo',       'href',  manifest.repository.url);
set('appName',             applications.current.replace(/^./, c => c.toUpperCase()));
set('appVersion',          applications.version);

if (manifest.contributions) {
	const about = document.querySelector('#about');
	const h3 = about.appendChild(document.createElement('h3'));
	h3.textContent = `Contributions`;
	manifest.contributions.forEach(({ who, what, link, license, }) => {
		const line = about.appendChild(document.createElement('div'));
		const _what = line.appendChild(document.createElement(link ? 'a' : 'span'));
		link && (_what.href = link) && (_what.target = '_blank');
		_what.textContent = what;
		line.appendChild(new Text(` by ${ who }${ license ? ' ('+ license +')' : ''}`));
	});
}

function set(key, attr, value) {
	value = arguments[arguments.length - 1];
	attr = arguments.length > 2 ? attr : 'textContent';
	const element = global.document.querySelector('#'+ key);
	element && (element[attr] = value);
}

}); })(this);

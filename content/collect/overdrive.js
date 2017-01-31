(function(global) { 'use strict'; define(({ // This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
	'node_modules/web-ext-utils/utils/inject': { inject, },
	module,
}) => {

const { call, } = (_=>_); // i.e. Function.prototype
const forEach = call.bind(Array.prototype.forEach);
const map  = call.bind(Array.prototype.map);

/**
 * Collects the book contents from the online reader of overdrive.com.
 * @return {object} Options that can be passed as argument to the EPub constructor.
 */
module.exports = function collect(options = { }) {

	// get a JSON clone of  window.wrappedJSObject.bData
	const bData = inject(() => window.bData);

	const resources = [ ];
	let nav = false;
	let cover = false;

	return ({
		chapters: map(document.querySelectorAll('.bounds>iframe'), (frame, index) => {
			// clone iframe document and leave the original untouched
			const doc = frame.contentDocument.documentElement.cloneNode(true);

			// find linked images
			resources.push(...map(doc.querySelectorAll('img'), ({ src, }) => ({ src, name: src.match(/:\/\/.*?\/(.*)$/)[1], })));

			// html clean-up
			doc.setAttribute('xmlns', "http://www.w3.org/1999/xhtml");
			forEach(doc.querySelectorAll('style, link, menu'), element => element.remove());
			forEach(doc.querySelectorAll('img'), img => !img.alt && (img.alt = 'IMAGE'));

			const styles = new Map([ [ '', 0, ], ]);

			forEach(doc.querySelectorAll('img'), e => e.previousSibling && e.previousSibling.src === e.src && e.remove());

			forEach(doc.querySelectorAll('*'), element => {
				const style = element.getAttribute('style');
				if (style && !styles.has(style)) {
					styles.set(style, styles.size);
				}
				const index = styles.get(style);
				element.removeAttribute('style');
				element.removeAttribute('data-loc');
				if (index && options.styles) {
					element.className = 'inline'+ index;
				} else {
					element.removeAttribute('class');
				}
			});

			let css = '';
			styles.forEach((index, style) => (css += style && ('\t\t\t.inline'+ index +' { '+ style +' }\n') || ''));

			// find meta data
			const name = (doc.querySelector('base') && doc.querySelector('base').href.match(/^.*?:\/\/.*?\/(.*?)$/) || [])[1];
			const navToc = name && findRecursive(bData.nav.toc, ({ path, }) => (path.replace(/[?#].*/, '')) === name, 'contents');
			const spine = name && findRecursive(bData.spine, ({ path, }) => (path.replace(/[?#].*/, '')) === name, 'contents');
			const title = navToc && navToc.title || (doc.querySelector('h1, h2, h3, h4') || { textContent: '', }).textContent;

			// TODO: use something nicer than 'innerHTML ='
			doc.querySelector('head').innerHTML = (`
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<title>
			${ (doc.querySelector('title') && doc.querySelector('title').innerHTML || '').trim() }
		</title>`) + (options.styles && css && `
		<style id="inlinetyles" type="text/css">
			${ css }
		</style>
` || '');

			// check if this document represents the (first) cover or ToC
			if (!nav && (
				name && (/^(content|contents|nav|navigation|inhalt)$/i).test((name.match(/\/(.*?)\.\w{1,10}$/) || [ '', '', ])[1])
				|| title && (/^(content|contents|nav|navigation|inhalt)$/i).test(title)
			)) {
				nav = decodeURI(name);
			}
			if (!cover && (
				name && (/^(cover|title|titel)$/i).test((name.match(/\/(.*?)\.\w{1,10}$/) || [ '', '', ])[1])
				|| title && (/^(cover|title|titel)$/i).test(title)
			)) {
				cover = decodeURI(name);
			}


			return ({
				name: name && decodeURI(name) || 'unnamed'+ index +'.html',
				title,
				content: toXML(doc),
				mimeType: spine && spine['media-type'] || doc.doctype && doc.doctype.name || 'xhtml',
				linear: spine && spine.linear,
			});
		}), // chapters
		title: bData.title.main,
		description: bData.description,
		language: bData.language,
		creator: bData.creator,
		resources,
		cover,
		nav: nav || true,
	});
};

function findRecursive(array, test, key) {
	let result;
	function find(item, index, array) {
		if (test(item, index, array)) {
			result = item;
			return true;
		}
		if (key === undefined && Array.isArray(item)) {
			return item.some(find);
		}
		if (Array.isArray(item[key])) {
			return item[key].some(find);
		}
		return false;
	}
	array.some(find);
	return result;
}

const serializer = new XMLSerializer;
function toXML(element) {
	return serializer.serializeToString(element);
}

}); })(this);
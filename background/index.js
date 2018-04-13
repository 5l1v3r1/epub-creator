(function(global) { 'use strict'; define(({ // This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
	'node_modules/web-ext-utils/browser/': { Tabs, browserAction, Notifications, },
	'node_modules/web-ext-utils/browser/version': { gecko, },
	'node_modules/web-ext-utils/loader/': { runInFrame, },
	'node_modules/web-ext-utils/update/': updated,
	'node_modules/web-ext-utils/utils/': { reportError, reportSuccess, },
	require,
}) => {

updated.extension.to.channel !== '' && console.info('Ran updates', updated);

browserAction && browserAction.onClicked.addListener(onClick);
async function onClick() { try {
	spinner.start();
	const tab = (await Tabs.query({ currentWindow: true, active: true, }))[0];
	let collector, name = null;
	if (tab.isInReaderMode) {
		collector = 'about-reader';
		name = (await (await require.async('./reader-mode'))(tab.url));
	} else if (/^https:\/\/[^/]*read\.overdrive\.com/.test(tab.url)) {
		collector = 'overdrive';
	} else {
		return void (await offerReader(tab));
	}

	name == null && (name = (await runInFrame(tab.id, 0,
		collector => require.async('content/collect').then(_=>_(collector)),
		collector
	)));
	console.info(`Saved book "${name}"`);
} catch (error) {
	currentTab = null; reportError(error);
} finally {
	spinner.stop();
} }

const spinner = {
	strings: [ '\\', '|', '/', '–', ],
	active: 0,
	start() {
		spinner.active++ <= 0 && spinner.spin();
	},
	stop() {
		--spinner.active <= 0 && browserAction.setBadgeText({ text: '', });
	},
	spin() {
		if (spinner.active <= 0) { return; }
		browserAction.setBadgeText({ text: spinner.strings[0], });
		spinner.strings.push(spinner.strings.shift());
		global.setTimeout(spinner.spin, 250);
	},
};
browserAction.setBadgeBackgroundColor({ color: [ 0x00, 0x7f, 0x00, 0x60, ], });

let currentTab = null;
function offerReader(tab) {
	if (gecko && tab.isArticle && !tab.isInReaderMode) {
		currentTab = tab.id;
		reportSuccess(`Open reader mode?`, `Click here if you want to open it in the reader mode and try again.`);
	} else {
		reportError(`Not supported`, `ePub creator doesn't support this site.`);
	}
}

gecko && Notifications.onClicked.addListener(async id => {
	if (id !== 'web-ext-utils:success') { return; }
	Notifications.clear('web-ext-utils:success');
	if (!currentTab) { return; }
	const tabId = currentTab; currentTab = null;
	try { (await Tabs.toggleReaderMode(tabId)); }
	catch (error) { reportError(`Could not open Reader Mode for the current page`); }
});

Object.assign(global, { onClick, offerReader, reportError, reportSuccess, }); // for debugging

}); })(this);

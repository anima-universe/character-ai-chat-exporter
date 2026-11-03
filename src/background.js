// The toolbar button. The extension asks for no site access in advance: pressing the button on a
// Character.AI tab gives it that one tab (activeTab) and it runs there. Anywhere else the button
// just opens Character.AI, so the next press works.
const CHARACTER_AI = /^https:\/\/([a-z0-9-]+\.)?character\.ai(\/|$)/i;

chrome.action.onClicked.addListener(async (tab) => {
    if (!tab.id) return;
    if (!tab.url || !CHARACTER_AI.test(tab.url)) {
        await chrome.tabs.create({ url: 'https://character.ai/' });
        return;
    }
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['src/core.js', 'src/page.js'] });
});

/**
 * Background script for Gmail Quick Colour
 * Handles keyboard commands defined in manifest.json and sends them to the active tab.
 */

chrome.commands.onCommand.addListener((command) => {
    // Get the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (!activeTab) return;

        // Send the command to the content script
        // We don't check tab.url because we might not have 'tabs' permission
        // The content script only runs on Gmail anyway, so other tabs will just ignore/fail gracefully
        chrome.tabs.sendMessage(activeTab.id, {
            action: 'apply_color',
            color: command.replace('color_', '') // 'color_blue' -> 'blue'
        }).catch(err => {
            // Content script might not be loaded or not a Gmail tab
            // This is expected for non-Gmail tabs
        });
    });
});

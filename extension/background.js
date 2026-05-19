// MV3 service worker — on toolbar click, inject apply_helper.js into active tab.
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["apply_helper.js"],
    });
  } catch (e) {
    console.error("Jobybot Apply Helper failed:", e);
  }
});

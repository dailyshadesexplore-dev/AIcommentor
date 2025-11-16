function getPostDescription(postEl) {
    const testId = postEl.querySelector('[data-test-id="post-content"]');
    if (testId) return testId.innerText.trim();

    const classic = postEl.querySelector('[class*="update-components-text"]');
    if (classic) return classic.innerText.trim();

    return "";
}
function addBtnToPost(postEl) {
    if (postEl.querySelector('.ai-comment-btn')) return;

    const btn = document.createElement('button');
    btn.innerText = 'Commentor';
    btn.className = 'ai-comment-btn';
    btn.style.marginLeft = '10px';
    btn.associatedPost = postEl;
    let actionBar = postEl.querySelector('.feed-shared-social-action-bar.feed-shared-social-action-bar--full-width.feed-shared-social-action-bar--has-social-counts')?.parentElement;
    if (!actionBar) {
        postEl.appendChild(btn);
    }
    else {
        actionBar.appendChild(btn);
    }


btn.addEventListener('click', () => {
    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = 'Generating...';

    // Use stable extractor for post description
    const postContent = getPostDescription(postEl);

    console.log("Post description:", postContent);

    sendMessageToBackground({ action: 'generateComment', text: postContent }, (res) => {
        console.log('Received response:', res);

        if (res?.success && res.comments) {
            const panel = document.createElement('div');
            panel.id = 'ai-comment-panel';
            panel.innerHTML = `<div class='panel-header'>${res.comments}</div>`;
            const panelCopy = document.createElement('button');
            panelCopy.innerText = 'Copy Comment';
            panelCopy.style.margin = '10px';
            panelCopy.addEventListener('click', () => {
                navigator.clipboard.writeText(res.comments).then(() => {
                    panelCopy.textContent = 'Copied!';
                    setTimeout(() => {
                        panelCopy.textContent = 'Copy Comment';
                    }, 2000);
                });
            });
            panel.appendChild(panelCopy);
            // Append panel to actionBar if exists, else post itself
            if (!actionBar) {
                postEl.appendChild(panel);
            } else {
                actionBar.appendChild(panel);
            }
        }

        // Re-enable button and restore original text
        btn.disabled = false;
        btn.textContent = originalText || 'Commentor';
    });
});
}

function scanAndAddButtons() {
    const posts = document.querySelectorAll('article, div.feed-shared-update-v2, div.occludable-update');
    posts.forEach(p => {
        addBtnToPost(p);

    });
}

const observer = new MutationObserver((mutations) => {
    scanAndAddButtons();
});




observer.observe(document.body, { childList: true, subtree: true });

// Safe wrapper for extension messaging to avoid "Cannot read properties of undefined (reading 'sendMessage')"
function sendMessageToBackground(message, callback) {
    // Prefer chrome.runtime (Chrome/Chromium). Use browser.runtime for Firefox compatibility.
    if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
        try {
            chrome.runtime.sendMessage(message, (res) => {
                if (chrome.runtime.lastError) {
                    // Log lastError but still call the callback
                    console.warn('chrome.runtime.lastError:', chrome.runtime.lastError);
                }
                if (typeof callback === 'function') callback(res);
            });
            return;
        } catch (e) {
            console.error('Error sending message via chrome.runtime:', e);
        }
    }

    if (typeof browser !== 'undefined' && browser.runtime && typeof browser.runtime.sendMessage === 'function') {
        try {
            const p = browser.runtime.sendMessage(message);
            if (p && typeof p.then === 'function') {
                p.then(res => callback && callback(res)).catch(err => {
                    console.error('browser.runtime.sendMessage error:', err);
                    callback && callback(null);
                });
                return;
            }
        } catch (e) {
            console.error('Error sending message via browser.runtime:', e);
        }
    }

    console.error('No runtime messaging API available in this context.');
    if (typeof callback === 'function') callback(null);
}

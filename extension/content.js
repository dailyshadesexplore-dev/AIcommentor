function getPostDescription(postEl) {
    const testId = postEl.querySelector('[data-test-id="post-content"]');
    if (testId) return testId.innerText.trim();

    const classic = postEl.querySelector('[class*="update-components-text"]');
    if (classic) return classic.innerText.trim();
    return "";
}
function addBtnToPost(postEl) {
    if (postEl.querySelector('.ai-comment-btn')) return;
    const panelInput = document.createElement('div');
    panelInput.className = 'ai-comment-input';
    panelInput.style.position = 'relative';
    panelInput.style.display = 'flex';
    panelInput.style.justifyContent = 'flex-start';
    panelInput.style.alignItems = 'center';
    panelInput.style.gap = '10px';
    panelInput.style.padding = '10px';

    const input = document.createElement('input');
    input.type = 'text';
    input.style.border = '1px solid #b53dffff';
    input.style.borderRadius = '15px';
    input.style.padding = '8px 12px';
    input.style.flex = '1';
    input.placeholder = "Ask AI to comment as...";
    panelInput.appendChild(input);

    const customTone = document.createElement('button');
    customTone.style.position = 'relative';
    customTone.className = 'ai-comment-tone-btn';
    customTone.style.border = 'none';
    customTone.style.background = 'transparent';
    customTone.style.cursor = 'pointer';
    customTone.style.marginBottom = '0';
    customTone.style.padding = '0';
    const Editicon = document.createElement('img');
    Editicon.src = chrome.runtime.getURL('assets/edit.png');

    Editicon.alt = 'Comment';
    Editicon.width = 25;
    Editicon.height = 25;
    customTone.appendChild(Editicon);
    panelInput.appendChild(customTone);


    const btn = document.createElement('button');
    btn.className = 'ai-comment-btn';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.border = 'none';
    btn.style.background = 'transparent';
    btn.style.cursor = 'pointer';
    btn.style.marginBottom = '0';
    btn.style.padding = '0';
    btn.associatedPost = postEl;
    // Use <img> for icon, get correct extension asset path
    const icon = document.createElement('img');
    icon.src = chrome.runtime.getURL('assets/btnIcon.png')

    icon.alt = 'Comment';
    icon.width = 32;
    icon.height = 32;
    btn.appendChild(icon);
    panelInput.appendChild(btn);


    let actionBar = postEl.querySelector('.feed-shared-social-action-bar.feed-shared-social-action-bar--full-width.feed-shared-social-action-bar--has-social-counts')?.parentElement;
    // if (!actionBar) {
    postEl.appendChild(panelInput);

    // }
    // else {
    //     actionBar.appendChild(panelInput);
    // }
    // setting tone to the prompt
    customTone.addEventListener('click', () => {
        const toneOptionsPanel = document.createElement('div');
        toneOptionsPanel.style.position = 'absolute';
        toneOptionsPanel.style.background = 'rgba(255, 255, 255, 0.75)';
        toneOptionsPanel.style.borderRadius = '8px';
        toneOptionsPanel.style.padding = '10px';
        toneOptionsPanel.style.boxShadow = '0 2px 8px rgba(255, 255, 255, 0.2)';
        toneOptionsPanel.style.zIndex = '1000';

        const tones = ['Professional', 'Casual', 'Humorous', 'Proactive','Expertise'];
        tones.forEach(tone => {
            const toneBtnClass = document.createElement('div');
            const toneBtnTitle = document.createElement('span');
            toneBtnTitle.textContent = tone;
            toneBtnTitle.style.fontWeight = 'bold'
            toneBtnClass.appendChild(toneBtnTitle)
            toneBtnClass.className = 'tone-options-btn';
            toneBtnClass.style.display = 'flex';
            toneBtnClass.style.flexDirection = 'row-reverse';
            toneBtnClass.style.padding = '5px';
            toneBtnClass.style.gap = '1rem';
            toneBtnClass.style.alignItems = 'center';
            const toneBtn = document.createElement('button');
            const icon = document.createElement('img');
            icon.src = chrome.runtime.getURL(`assets/${tone}.png`)
            icon.alt = 'Comment';
            icon.width = 32;
            icon.height = 32;
            toneBtn.appendChild(icon);
            toneBtn.style.display = 'flex';
            toneBtn.style,alignItems = 'center';
            toneBtn.style.width = '100%';
            toneBtn.style.marginBottom = '5px';
            toneBtn.addEventListener('click', () => {
                if(input.value.length > 0){
                    input.value=` ${input.value}. Please write a ${tone.toLowerCase()} comment.`;
                }
                else{
                input.value = `Please write a ${tone.toLowerCase()} comment.`;

                }

                if (toneOptionsPanel.parentNode) toneOptionsPanel.parentNode.removeChild(toneOptionsPanel);
            });
            toneBtnClass.appendChild(toneBtn);
            toneOptionsPanel.appendChild(toneBtnClass);

        });
        // Append panel to body (so absolute positioning works) and not as a child of the button.
        document.body.appendChild(toneOptionsPanel);
        // Position the panel below the tone button
        const rect = customTone.getBoundingClientRect();
        toneOptionsPanel.style.top = `${rect.bottom + window.scrollY}px`;
        toneOptionsPanel.style.left = `${rect.left + window.scrollX}px`;

        // Close the panel when clicking outside. Use a deferred listener so the opening click
        // doesn't immediately trigger the close. Remove the panel safely (check parent).
        const closePanel = (event) => {
            if (!toneOptionsPanel.contains(event.target) && !customTone.contains(event.target)) {
                if (toneOptionsPanel.parentNode) {
                    toneOptionsPanel.parentNode.removeChild(toneOptionsPanel);
                }
                document.removeEventListener('click', closePanel);
            }
        };
        // Defer adding the listener to avoid handling the opening click as an outside click.
        setTimeout(() => document.addEventListener('click', closePanel), 0);


    })

    btn.addEventListener('click', () => {
        btn.disabled = true;
        btn.firstChild && (btn.firstChild.style.opacity = '0.5');
        document.querySelectorAll('#ai-comment-panel').forEach(panel => panel.remove());
        const postContent = getPostDescription(postEl);
        sendMessageToBackground({ action: 'generateComment', text: `${postContent} \\\n ${input.value}` }, (res) => {
            console.log('Received response:', res);

            if (res?.success && res.comments) {
                input.value = '';
                const panel = document.createElement('div');
                panel.id = 'ai-comment-panel';
                panel.style.marginTop = '10px';
                panel.style.padding = '10px';
                panel.style.border = '1px solid #eee';
                panel.style.background = '#fafbfc';

                const panelHeader = document.createElement('div');
                panelHeader.className = 'panel-header';
                panelHeader.textContent = res.comments;
                panelHeader.style.marginBottom = '8px';

                const panelCopy = document.createElement('button');
                panelCopy.innerText = 'Copy Comment';
                panelCopy.style.margin = '0 0 0 8px';
                panelCopy.style.padding = '4px 10px';
                panelCopy.style.borderRadius = '8px';
                panelCopy.style.border = '1px solid #b53dff';
                panelCopy.style.background = '#fff';
                panelCopy.style.cursor = 'pointer';
                panelCopy.addEventListener('click', () => {
                    navigator.clipboard.writeText(res.comments).then(() => {
                        panelCopy.textContent = 'Copied!';
                        setTimeout(() => {
                            panelCopy.textContent = 'Copy Comment';
                        }, 2000);
                    });
                });

                // Flex container for input and button
                const flexRow = document.createElement('div');
                flexRow.style.display = 'flex';
                flexRow.style.alignItems = 'center';
                flexRow.appendChild(panelHeader);
                flexRow.appendChild(panelCopy);

                panel.appendChild(flexRow);

                // Append panel to actionBar if exists, else post itself
                if (!actionBar) {
                    postEl.appendChild(panel);
                } else {
                    actionBar.appendChild(panel);
                }
            }

            // Re-enable button and restore icon
            btn.disabled = false;
            btn.firstChild && (btn.firstChild.style.opacity = '1');
        });
    });
}

function scanAndAddButtons() {
    const posts = document.querySelectorAll('div.feed-shared-update-v2');
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

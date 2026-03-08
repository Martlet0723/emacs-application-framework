try {
    let Marker = {};
    window.Marker = Marker;

    function getVisibleElements(filter) {
        let all = Array.from(document.documentElement.getElementsByTagName("*"));
        let visibleElements = [];
        for (let i = 0; i < all.length; i++) {
            let e = all[i];
            // include elements in a shadowRoot.
            if (e.shadowRoot) {
                let cc = e.shadowRoot.querySelectorAll('*');
                for (let j = 0; j < cc.length; j++) {
                    all.push(cc[j]);
                }
            }
            let rect = e.getBoundingClientRect();
            if ( (rect.top <= window.innerHeight) && (rect.bottom >= 0)
                 && (rect.left <= window.innerWidth) && (rect.right >= 0)
                 && rect.height > 0
                 && getComputedStyle(e).visibility !== 'hidden'
               ) {
                filter(e, visibleElements);
            }
        }
        return visibleElements;
    }

    function moveCursorToEnd(el) {
        if (typeof el.selectionStart == "number") {
            el.selectionStart = el.selectionEnd = el.value.length;
        } else if (typeof el.createTextRange != "undefined") {
            el.focus();
            let range = el.createTextRange();
            range.collapse(false);
            range.select();
        }
    }

    function cssSelector(el) {
        let path = [], parent;
        while (parent = el.parentNode) {
            path.unshift(`${el.tagName}:nth-child(${[].indexOf.call(parent.children, el)+1})`);
            el = parent;
        }
        return `${path.join(' > ')}`.toLowerCase();
    }

    function isElementClickable(e) {
        let clickSelectors = "a, button, select, input, textarea, summary, *[onclick], *[contenteditable=true], *.jfk-button, *.goog-flat-menu-button, *[role=button], *[role=link], *[role=menuitem], *[role=option], *[role=switch], *[role=tab], *[role=checkbox], *[role=combobox], *[role=menuitemcheckbox], *[role=menuitemradio], *.collapsed, *.expanded, *.dropdown, *.est_unselected, *.tab, *.mod-action-wrap, *.menu-item, [id^=couplet3_], *.eaf-file-manager-file-name, *.eaf-file-manager-preview-file-name, *.eaf-music-player-item, *.eaf-rss-reader-feed-item, *.eaf-rss-reader-article-item, *.item, *[tabindex]:not([tabindex='-1']), *[style*='cursor: pointer'], *[style*='cursor:pointer'], label, *[data-click], *[data-href], *.btn, *.button, *.clickable";

        return e.matches(clickSelectors) || getComputedStyle(e).cursor === "pointer" || getComputedStyle(e).cursor.substr(0, 4) === "url(";
    }

    function isEditable(element) {
        return element
            && !element.disabled && (element.localName === 'textarea'
                                     || element.localName === 'select'
                                     || element.isContentEditable
                                     || (element.localName === 'input' && /^(?!button|checkbox|file|hidden|image|radio|reset|submit)/i.test(element.type)));
    }

    function isElementDrawn(e, rect) {
        var min = isEditable(e) ? 1 : 4;
        rect = rect || e.getBoundingClientRect();
        return rect.width >= min || rect.height >= min;
    }

    function getRealRect(elm) {
        if(!elm.getBoundingClientRect){
            return getRealRect(elm.parentNode);
        };
        if (elm.childElementCount === 0) {
            let r = elm.getClientRects();
            if (r.length === 3) {
                // for a clipped A tag
                return r[1];
            } else if (r.length === 2) {
                // for a wrapped A tag
                return r[0];
            } else {
                return elm.getBoundingClientRect();
            }
        } else if (elm.childElementCount === 1 && elm.firstElementChild.textContent) {
            let r = elm.firstElementChild.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) {
                r = elm.getBoundingClientRect();
            }
            return r;
        } else {
            return elm.getBoundingClientRect();
        }
    }

    function filterOverlapElements(elements) {
        // filter out tiny elements
        elements = elements.filter(function(e) {
            let be = getRealRect(e);
            if (e.disabled || e.readOnly || !isElementDrawn(e, be)) {
                return false;
            } else if (e.matches("input, textarea, select, form") || e.contentEditable === "true") {
                return true;
            } else {
                let topElement = document.elementFromPoint(be.left + be.width/2, be.top + be.height/2);
                return !topElement || (topElement.shadowRoot && topElement.childElementCount === 0) || topElement.isSameNode(e) || e.contains(topElement) || topElement.contains(e);
            }
        });

        // if an element has href, all its children will be filtered out.
        var elementWithHref = null;
        elements = elements.filter(function(e) {
            var flag = true;
            if (e.href) {
                elementWithHref = e;
            }
            if (elementWithHref && elementWithHref !== e && elementWithHref.contains(e)) {
                flag = false;
            }
            return flag;
        });

        return filterAncestors(elements);
    }

    function last(array) {
        return array[array.length - 1];
    }

    function filterAncestors(elements) {
        if (elements.length === 0) {
            return elements;
        }

        // filter out element which has its children covered
        let result = [last(elements)];
        for (let i = elements.length - 2; i >= 0; i--) {
            if (!elements[i].contains(last(result))) {
                result.push(elements[i]);
            }
        }

        // To restore original order of elements
        return result.reverse();
    }

    function cAdd1(keyCounter, index, maxDigit){
        if(keyCounter[index] + 1 == maxDigit){
            keyCounter[index] = 0;
            cAdd1(keyCounter, index + 1, maxDigit);
        } else {
            keyCounter[index]++;
        }
    }

    function generateKeys(markerContainer) {
        let lettersString = "%{marker_letters}";
        let letters = lettersString.split("");
        let nodeNum = markerContainer.children.length;
        let keyLen = nodeNum == 1 ? 1 : Math.ceil(Math.log(nodeNum)/Math.log(letters.length));
        let keyCounter = [];
        for(let i = 0; i < keyLen; i++) keyCounter[i] = 0;
        for(let l = 0; l < nodeNum; l++) {
            let keyStr = '';
            for(let k = 0; k < keyLen; k++) {
                let mark = document.createElement('span');
                mark.setAttribute('class', 'eaf-mark');
                let key = letters[keyCounter[k]];
                mark.textContent = key;
                markerContainer.children[l].appendChild(mark);
                keyStr += key;
                cAdd1(keyCounter, 0, letters.length);
            }
            markerContainer.children[l].id = keyStr;
        }
    }


    Marker.generateMarker = (selectors) => {
        let style = document.createElement('style');
        let offsetX = "%{marker_offset_x}";
        let offsetY = "%{marker_offset_y}";
        document.head.appendChild(style);
        style.type = 'text/css';
        style.setAttribute('class', 'eaf-style darkreader');
        style.appendChild(document.createTextNode('\
.eaf-mark {\
background: none;\
border: none;\
bottom: auto;\
box-shadow: none;\
color: black !important;\
cursor: auto;\
display: inline;\
float: none;\
font-size: inherit;\
font-variant: normal;\
font-weight: bold;\
height: auto;\
left: auto;\
letter-spacing: 0;\
line-height: 100%;\
margin: 0;\
max-height: none;\
max-width: none;\
min-height: 0;\
min-width: 0;\
opacity: 1;\
padding: 0;\
position: static;\
right: auto;\
text-align: left;\
text-decoration: none;\
text-indent: 0;\
text-shadow: none;\
text-transform: none;\
top: auto;\
vertical-align: baseline;\
white-space: normal;\
width: auto;\
z-index: 2140000001;\
}'));
        style.appendChild(document.createTextNode('\
.eaf-marker {\
position: fixed;\
display: block;\
white-space: nowrap;\
overflow: hidden;\
font-size: %{marker_fontsize}px;\
background: linear-gradient(to bottom, #ffdd6e 0%, #deb050 100%);\
padding-left: 3px;\
padding-right: 3px;\
border: 1px solid #c38a22;\
border-radius: 3px;\
box-shadow: 0px 3px 7px 0px rgba(0, 0, 0, 0.3);\
z-index: 2140000001;\
}'));

        let body = document.querySelector('body');
        let markerContainer = document.createElement('div');
        markerContainer.setAttribute('class', 'eaf-marker-container');
        body.insertAdjacentElement('afterend', markerContainer);
        for(let i = 0; i < selectors.length; i++) {
            if(selectors[i] != undefined){
                if(!selectors[i].tagName){
                    selectors[i] = selectors[i].parentNode;
                }
                let marker = document.createElement('div');
                let rect = selectors[i].getBoundingClientRect();
                marker.setAttribute('class', 'eaf-marker');
                marker.setAttribute('style', 'left: ' + (rect.x + parseInt(offsetX)) + 'px; top: ' + (rect.y + parseInt(offsetY)) + 'px;');
                marker.setAttribute('pointed-link', cssSelector(selectors[i]));
                markerContainer.appendChild(marker);
            }
        }
        generateKeys(markerContainer);
    };

    Marker.getMarkerSelector = (key) => {
        let markers = document.querySelectorAll('.eaf-marker');
        let match;
        for(let i = 0; i < markers.length; i++) {
            if(markers[i].id === key.toUpperCase()) {
                match = markers[i];
                break;
            }
        }
        if (match !== undefined) {
            return match.getAttribute('pointed-link');
        } else {
            return undefined;
        }
    };

    Marker.gotoMarker = (key, callback)=>{
        selector = Marker.getMarkerSelector(key);
        console.log("[EAF Marker] key:", key, "selector:", selector);
        if (selector != undefined && callback != undefined){
            const node = document.querySelector(selector);
            console.log("[EAF Marker] found node:", node);
            if (node) {
                console.log("[EAF Marker] node tagName:", node.tagName, "className:", node.className, "id:", node.id);
            }
            return callback(node);
        } else {
            return "";
        }
    };

    Marker.getMarkerText = (key) => {
        selector = Marker.getMarkerSelector(key);
        if (selector != undefined){
            return document.querySelector(selector).innerText;
        } else {
            return "";
        }
    };

    Marker.getMarkerClass = (key) => {
        selector = Marker.getMarkerSelector(key);
        if (selector != undefined){
            return document.querySelector(selector).className;
        } else {
            return "";
        }
    };

    // Helper function to dispatch click event that works with React, Radix UI and other frameworks
    function dispatchClickEvent(node) {
        console.log("[EAF Marker] dispatchClickEvent called for:", node);
        const rect = node.getBoundingClientRect();
        const clientX = rect.left + rect.width / 2;
        const clientY = rect.top + rect.height / 2;
        console.log("[EAF Marker] Click position:", clientX, clientY);
        
        // Focus the element first (important for some UI libraries)
        if (node.focus) {
            node.focus();
            console.log("[EAF Marker] Focused element");
        }
        
        // Common event options for maximum compatibility
        const eventOpts = {
            view: window,
            bubbles: true,
            cancelable: true,
            composed: true,  // Important for Shadow DOM and some frameworks
            clientX: clientX,
            clientY: clientY,
            button: 0,
            buttons: 1
        };
        
        const pointerOpts = {
            ...eventOpts,
            pointerId: 1,
            pointerType: 'mouse',
            isPrimary: true,
            width: 1,
            height: 1,
            pressure: 0.5,
            tiltX: 0,
            tiltY: 0
        };
        
        // Dispatch full event sequence for maximum compatibility
        // Many frameworks (React, Radix UI, etc.) use event delegation and synthetic events
        
        // 1. Hover events (some frameworks need these)
        try {
            node.dispatchEvent(new PointerEvent('pointerover', { ...pointerOpts, buttons: 0 }));
            node.dispatchEvent(new PointerEvent('pointerenter', { ...pointerOpts, buttons: 0, bubbles: false }));
            node.dispatchEvent(new MouseEvent('mouseover', { ...eventOpts, buttons: 0 }));
            node.dispatchEvent(new MouseEvent('mouseenter', { ...eventOpts, buttons: 0, bubbles: false }));
        } catch(e) { console.log("[EAF Marker] hover events error:", e); }
        
        // 2. PointerEvent sequence (modern approach for Radix UI, etc.)
        try {
            node.dispatchEvent(new PointerEvent('pointerdown', pointerOpts));
            console.log("[EAF Marker] Dispatched pointerdown");
        } catch(e) { console.log("[EAF Marker] pointerdown error:", e); }
        
        // 3. MouseEvent sequence (for React synthetic events)
        try {
            node.dispatchEvent(new MouseEvent('mousedown', eventOpts));
            console.log("[EAF Marker] Dispatched mousedown");
        } catch(e) { console.log("[EAF Marker] mousedown error:", e); }
        
        // Small delay to simulate real click timing (some frameworks need this)
        
        try {
            node.dispatchEvent(new MouseEvent('mouseup', eventOpts));
            console.log("[EAF Marker] Dispatched mouseup");
        } catch(e) { console.log("[EAF Marker] mouseup error:", e); }
        
        try {
            node.dispatchEvent(new PointerEvent('pointerup', { ...pointerOpts, pressure: 0 }));
            console.log("[EAF Marker] Dispatched pointerup");
        } catch(e) { console.log("[EAF Marker] pointerup error:", e); }
        
        // 4. Final click event
        try {
            node.dispatchEvent(new MouseEvent('click', eventOpts));
            console.log("[EAF Marker] Dispatched click");
        } catch(e) { console.log("[EAF Marker] click error:", e); }
        
        // 5. Fallback: call click() method directly (only works for HTML elements, not SVG)
        try {
            if (typeof node.click === 'function') {
                node.click();
                console.log("[EAF Marker] Called node.click()");
            } else {
                console.log("[EAF Marker] node.click() not available (SVG element), events already dispatched");
            }
        } catch(e) { console.log("[EAF Marker] node.click() error:", e); }
        
        // 6. Keyboard event fallback (for frameworks that check isTrusted)
        // Buttons and interactive elements should respond to Enter or Space
        try {
            const keydownEnter = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true,
                composed: true
            });
            node.dispatchEvent(keydownEnter);
            
            const keyupEnter = new KeyboardEvent('keyup', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true,
                composed: true
            });
            node.dispatchEvent(keyupEnter);
            console.log("[EAF Marker] Dispatched keyboard Enter events");
        } catch(e) { console.log("[EAF Marker] keyboard error:", e); }
    }

    // Helper function to find clickable ancestor for SVG inner elements
    function findClickableAncestor(node) {
        // SVG elements and their inner elements
        const svgElements = ['use', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'text', 'tspan', 'g', 'svg'];
        const nodeName = node.nodeName.toLowerCase();
        
        if (svgElements.includes(nodeName)) {
            // For SVG elements, skip SVG itself and find the real clickable container
            // (button, a, [role=button], etc.) because click handlers are usually on parent elements
            let parent = node.parentElement;
            while (parent) {
                const parentName = parent.nodeName.toLowerCase();
                // Found a real interactive element, return it
                if (['button', 'a', 'summary'].includes(parentName) ||
                    parent.matches('[role="button"], [role="link"], [role="menuitem"], [role="tab"], [role="checkbox"], [role="switch"], [role="option"]') ||
                    parent.hasAttribute('onclick') ||
                    parent.hasAttribute('data-click') ||
                    parent.hasAttribute('data-href')) {
                    return parent;
                }
                parent = parent.parentElement;
            }
        }
        return node;
    }

    // this is callback function which call by core.webengine.py get_mark_link
    Marker.getMarkerAction = (node) => {
        action = "";
        if(node == null){
            return action;
        }
        
        // For SVG inner elements, find the clickable ancestor
        node = findClickableAncestor(node);
        console.log("[EAF Marker] After findClickableAncestor:", node.tagName, node.className);
        
        if(node.nodeName.toLowerCase() === 'select'){
            action = "eaf::[select]focus";
            node.focus();
        }else if(node.nodeName.toLowerCase() === 'input' ||
                 node.nodeName.toLowerCase() === 'textarea') {
            if((node.getAttribute('type') === 'submit') ||
               (node.getAttribute('type') === 'checkbox')){
                action = "eaf::[" + node.nodeName + "&" + node.getAttribute('type') + "]click";
                dispatchClickEvent(node);
            } else {
                action = "eaf::focus_click_movecursor_to_end";
                node.focus();   // focus
                if (typeof node.click === 'function') {
                    node.click();   // show blink cursor
                }
                moveCursorToEnd(node); // move cursor to the end of line after focus.
            }
        } else if(node.href != undefined && node.href != '' && typeof node.href === 'string' && 
                  node.getAttribute('href') != '' && node.getAttribute('class') != 'toggle'){
            if (node.href.includes('javascript:void') || node.getAttribute('href') == '#'){
                action = "eaf::[href]click";
                dispatchClickEvent(node);
            } else {
                return node.href;
            }
        } else if(isElementClickable(node)){  // special href # button or clickable element
            action = "eaf::click";
            dispatchClickEvent(node);
        } else if(node.nodeName.toLowerCase() === 'p'||
                  node.nodeName.toLowerCase() === 'span') {  // select text section
            action = "eaf::select_p_span";
            window.getSelection().selectAllChildren(node);
        }
        return action;
    };

    Marker.generateClickMarkerList = () => {
        let elements = getVisibleElements(function(e, v) {
            if(isElementClickable(e)) v.push(e);
        });
        elements = filterOverlapElements(elements);
        return elements;
    };

    Marker.generateTextMarkerList = () => {
        let elements = getVisibleElements(function(e, v) {
            let aa = e.childNodes;
            for (let i = 0, len = aa.length; i < len; i++) {
                if (aa[i].nodeType == Node.TEXT_NODE && aa[i].data.length > 0) {
                    v.push(e);
                    break;
                }
            }
        });

        elements = Array.prototype.concat.apply([], elements.map(function (e) {
            let aa = e.childNodes;
            let bb = [];
            for (let i = 0, len = aa.length; i < len; i++) {
                if (aa[i].nodeType == Node.TEXT_NODE && aa[i].data.trim().length > 1) {
                    bb.push(aa[i]);
                }
            }
            return bb;
        }));

        return elements;
    };


    Marker.cleanupLinks = () => {
        try {
            document.querySelector('.eaf-marker-container').remove();
            document.querySelector('.eaf-style').remove();
        } catch (err) {}
    };

} catch (e) {}

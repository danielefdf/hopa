const TAB_START_CHAR = "{";
const STATE_START_CHAR = "}";
const SITE_START_CHAR = "[";
const ICON_START_CHAR = "]";
const URL_START_CHAR = "(";

const ACC_SITES_PANEL_PADDING = 6;
const ACC_DIV_CLOSED_HEIGHT = 44;
const SITES_PANEL_COLS = 5;
const SITE_LINK_A_WIDTH = 200;
const SITE_LINK_A_HEIGHT = 61;
const SITE_LINK_A_TOP = 38;

var accDragFired = false;

main();

function main() {
    var addSiteModal = document.getElementById("add-site-modal");
    setAddSiteModal(addSiteModal);

    var addTabModal = document.getElementById("add-tab-modal");
    setAddTabModal(addTabModal, addSiteModal);

    setWindowOnMouseDown(addSiteModal, addTabModal);

    createAllDiv(addSiteModal);

    if (localStorage.data != null) {
        /* structure
            "{tabName}tabState[site1Name]siteIconType(site1Url ...
                          ... [site2Name]siteIconType(site2Url ...
         ... {tabName|tabState[site1Name]siteIconType(site1Url ...
                          ... [site2Name]siteIconType(site2Url ...
         ..."
        */
        var tabsData = localStorage.data.split(TAB_START_CHAR);
        for (t = 1; t < tabsData.length; t++) {  // t[0] is always empty
            var tabData = tabsData[t].split(STATE_START_CHAR);
            var tabName = tabData[0];
            var tabData = tabData[1].split(SITE_START_CHAR);
            var tabState = tabData[0];
            createAccDiv(tabData, tabName, tabState, addSiteModal);
        }
    }
    createAddTabDiv(addTabModal);
    createEmptySpace();

    var allButton = document.getElementsByClassName("all-button")[0];
    var accButtons = document.getElementsByClassName("acc-button");

    checkAccButtons(accButtons);

    checkAllButtonOpenClose(allButton);
    setAllButtonClickListener(allButton, accButtons);

    setAllButtonOnfocusListener(allButton, addSiteModal, addTabModal);
}

function writeLocalStorage() {
    /* structure
        "{tabName}tabState[site1Name]siteIconType(site1Url
                          [site2Name]siteIconType(site2Url
         {tabName|tabState[site1Name]siteIconType(site1Url
                          [site2Name]siteIconType(site2Url
         ..."
    */
    var accButtonsHtmlClcn = document.getElementsByClassName("acc-button");

    accButtons = [].slice.call(accButtonsHtmlClcn);
    accButtons.sort(function(a, b){
        var aTop = a.parentElement.offsetTop;
        var bTop = b.parentElement.offsetTop;
        return aTop - bTop;
    });

    d = ""
    for (i = 0; i < accButtons.length; i++) {
        if (! accButtons[i].classList.contains("all-button")) {
            var accStateDiv = accButtons[i].children[0];
            var accState = "closed";
            if (accStateDiv.classList.contains("acc-state-open")) {
                accState = "open";
            }
            var accButtonLabel = accButtons[i].children[1];
            d += TAB_START_CHAR + accButtonLabel.innerHTML
                    + STATE_START_CHAR + accState;
            /*
            console.log(TAB_START_CHAR + accButtonLabel.innerHTML
                    + STATE_START_CHAR + accState);
            */
            var accPanel = accButtons[i].nextElementSibling;
            var sitesPanelDiv = accPanel.children[1];
            var linksHtmlClcn = sitesPanelDiv.children;

            /* sort by a hashcode, defined by top and left offsets */
            links = [].slice.call(linksHtmlClcn);
            links.sort(function(a, b){
                // e.g. : {38, 206} => 38000206
                var aIndex = 1000000 * a.offsetTop + a.offsetLeft;
                var bIndex = 1000000 * b.offsetTop + b.offsetLeft;
                return aIndex - bIndex;
            });

            for (j = 0; j < links.length; j++) {
                var icon = links[j].children[0];
                var iconType;
                switch (true) {
                case icon.classList.contains("site-icon-link"):
                    iconType = "link";
                    break;
                case icon.classList.contains("site-icon-init"):
                    iconType = "init";
                    break;
                }
                var nameDiv = links[j].children[1];
                var name = nameDiv.innerHTML;
                var urlDiv = links[j].children[5];
                var url = urlDiv.innerHTML;
                d += SITE_START_CHAR + name
                        + ICON_START_CHAR + iconType
                        + URL_START_CHAR + url;
                /*
                console.log(SITE_START_CHAR + name
                        + ICON_START_CHAR + iconType
                        + URL_START_CHAR + url);
                */
            }
        }
    }

    localStorage.data = d;
}

function setAddSiteModal(addSiteModal) {
    var closeButton = addSiteModal.children[0].children[0];
    closeButton.addEventListener("click", function() {
        addSiteModal.classList.remove("SITE_DIV_REQUEST_ADD");
        addSiteModal.classList.remove("SITE_DIV_REQUEST_EDIT");

        var sitesToEdit = document.getElementsByClassName("SITE_LINK_A_TO_EDIT");
        for (i = 0; i < sitesToEdit.length; i++) {
            sitesToEdit[i].classList.remove("SITE_LINK_A_TO_EDIT");
        }

        addSiteModal.style.display = "none";
    });

    var siteNameInput = addSiteModal.children[0].children[1];
    siteNameInput.addEventListener("input", function() {
        var name = this.value;

        var initDiv = document.createElement("div");
        initDiv.classList.add("site-icon-init");
        initDiv.style.backgroundColor = getRandomColor();
        initDiv.innerHTML = name.substr(0, 1).toUpperCase();

        var initLabel = addSiteModal.children[0].children[3].children[3];
        while (initLabel.firstChild) {
            initLabel.removeChild(initLabel.firstChild);
        }
        initLabel.appendChild(initDiv);
    });

    var siteUrlInput = addSiteModal.children[0].children[2];
    siteUrlInput.addEventListener("input", function() {
        var url = this.value;

        var linkImg = document.createElement("img");
        linkImg.classList.add("site-icon-link");
        /* linkImg.style.backgroundColor = "white";
           l'effetto finale è bruttino*/
        linkImg.src = getFavicon(url);

        var linkLabel = addSiteModal.children[0].children[3].children[1];
        while (linkLabel.firstChild) {
            linkLabel.removeChild(linkLabel.firstChild);
        }
        linkLabel.appendChild(linkImg);
    });

    addSiteModal.addEventListener("submit", function() {
        switch (true) {
        case this.classList.contains("SITE_DIV_REQUEST_ADD"):
            addSite(this);
            break;
        case this.classList.contains("SITE_DIV_REQUEST_EDIT"):
            editSite(this);
            break;
        }

        this.classList.remove("SITE_DIV_REQUEST_ADD");
        this.classList.remove("SITE_DIV_REQUEST_EDIT");

        this.style.display = "none";

        writeLocalStorage();
    });
}

function addSite(addSiteModal) {
    var siteNameDiv = addSiteModal.children[0].children[1];
    var siteName = siteNameDiv.value;
    var siteUrlDiv = addSiteModal.children[0].children[2];
    var siteUrl = siteUrlDiv.value;
    var sitesPanelDiv = document.getElementsByClassName("SITE-PANEL-ACTIVE")[0];
    var tabState = "open";
    var siteIconTypeRadios = document.getElementsByClassName("modal-radio");
    var siteIconType = "";
    for (i = 0; i < siteIconTypeRadios.length; i++) {
        if (siteIconTypeRadios[i].checked) {
            siteIconType = siteIconTypeRadios[i].value;
            break;
        }
    }

    var s = sitesPanelDiv.children.length;

    createSiteLinkA(sitesPanelDiv, tabState, s, siteName, siteIconType, siteUrl);
}

function editSite(addSiteModal) {
    var siteNameDiv = addSiteModal.children[0].children[1];
    var siteName = siteNameDiv.value;
    var siteUrlDiv = addSiteModal.children[0].children[2];
    var siteUrl = siteUrlDiv.value;
    var siteIconTypeRadios = document.getElementsByClassName("modal-radio");
    var siteIconType = "";
    for (i = 0; i < siteIconTypeRadios.length; i++) {
        if (siteIconTypeRadios[i].checked) {
            siteIconType = siteIconTypeRadios[i].value;
            break;
        }
    }

    var siteLinkA = document.getElementsByClassName("SITE_LINK_A_TO_EDIT")[0];

    var siteIconOldElement = siteLinkA.children[0];

    switch (siteIconType) {
    case "link":
        var siteIconImg = document.createElement("img");
        siteIconImg.classList.add("site-icon-link");
        siteIconImg.rel = "shortcut icon";
        siteIconImg.src = getFavicon(siteUrl);
        siteIconImg.alt = siteName;

        siteLinkA.replaceChild(siteIconImg, siteIconOldElement);
        break;
    case "init":
        var siteIconDiv = document.createElement("div");
        siteIconDiv.classList.add("site-icon-init");
        siteIconDiv.style.backgroundColor = getRandomColor();
        siteIconDiv.innerHTML = siteName.substr(0, 1).toUpperCase();

        siteLinkA.replaceChild(siteIconDiv, siteIconOldElement);
        break;
    }

    var siteNameDiv = siteLinkA.children[1];
    siteNameDiv.innerHTML = siteName;

    var siteUrlDiv = siteLinkA.children[5];
    siteUrlDiv.innerHTML = siteUrl;

    siteLinkA.classList.remove("SITE_LINK_A_TO_EDIT");
}

function setAddTabModal(addTabModal, addSiteModal) {
    var closeButton = addTabModal.children[0].children[0];
    closeButton.addEventListener("click", function() {
        addTabModal.classList.remove("ACC_BUTTON_REQUEST_ADD");
        addTabModal.classList.remove("ACC_BUTTON_REQUEST_EDIT");

        var accButtonsToEdit = document.getElementsByClassName("ACC_BUTTON_TO_EDIT");
        for (i = 0; i < accButtonsToEdit.length; i++) {
            accButtonsToEdit[i].classList.remove("ACC_BUTTON_TO_EDIT");
        }

        addTabModal.style.display = "none";
    });
    addTabModal.addEventListener("submit", function() {
        switch (true) {
        case this.classList.contains("ACC_BUTTON_REQUEST_ADD"):
            addTab(this, addSiteModal);
            break;
        case this.classList.contains("ACC_BUTTON_REQUEST_EDIT"):
            editTab(this);
            break;
        }

        this.classList.remove("ACC_BUTTON_REQUEST_ADD");
        this.classList.remove("ACC_BUTTON_REQUEST_EDIT");

        this.style.display = "none";

        writeLocalStorage();
    });
}

function addTab(addTabModal, addSiteModal) {
    var tabData = [];
    var tabNameDiv = addTabModal.children[0].children[1];
    var tabName = tabNameDiv.value;
    var tabState = "open";
    createAccDiv(tabData, tabName, tabState, addSiteModal);
}

function createAccDiv(tabData, tabName, tabState, addSiteModal) {
    var accButton = document.createElement("button");
    setAccButton(accButton, tabName, tabState);

    var accPanelDiv = document.createElement("div");
    setAccPanelDiv(accPanelDiv, tabData, tabName, tabState, addSiteModal);

    var accDiv = document.createElement("div");
    accDiv.classList.add("acc-div");
    if (tabName == "ALL") {
        accDiv.classList.add("all-div");
    }
    accDiv.classList.add("queued-element");
    accDiv.appendChild(accButton);
    accDiv.appendChild(accPanelDiv);

    accButtonGrab = accButton.children[2];
    setDraggableAccDiv(accButtonGrab, accDiv);

    document.body.appendChild(accDiv);
}

function setAccButton(accButton, tabName, tabState) {
    var accStateDiv = document.createElement("div");
    accStateDiv.classList.add("acc-state");
    if (tabName != "ALL") {
        switch (tabState) {
        case "open":
            accStateDiv.classList.add("acc-state-open");
            break;
        case "closed":
            accStateDiv.classList.remove("acc-state-open");
            break;
        }
    }

    var accButtonLabel = document.createElement("div");
    accButtonLabel.classList.add("acc-button-label");
    accButtonLabel.innerHTML = tabName;

    var accButtonGrab = document.createElement("div");
    if (tabName != "ALL") {
        var accButtonGrabText = document.createElement("div");
        accButtonGrabText.classList.add("action-button-text");
        accButtonGrabText.classList.add("grab-button-text");
        accButtonGrabText.innerHTML = "❖";

        accButtonGrab.classList.add("action-button");
        accButtonGrab.classList.add("acc-button-action");
        accButtonGrab.appendChild(accButtonGrabText);
    }

    var accButtonEdit = document.createElement("div");
    if (tabName != "ALL") {
        var accButtonEditText = document.createElement("div");
        accButtonEditText.classList.add("action-button-text");
        accButtonEditText.classList.add("edit-button-text");
        accButtonEditText.innerHTML = "🖉";

        accButtonEdit.classList.add("action-button");
        accButtonEdit.classList.add("acc-button-action");
        accButtonEdit.appendChild(accButtonEditText);
        accButtonEdit.addEventListener("click", function(e) {
            e.stopPropagation();

            var accButtonsToEdit = document.getElementsByClassName("ACC_BUTTON_TO_EDIT");
            for (i = 0; i < accButtonsToEdit.length; i++) {
                accButtonsToEdit[i].classList.remove("ACC_BUTTON_TO_EDIT");
            }

            accButton.classList.add("ACC_BUTTON_TO_EDIT");

            var addTabModal = document.getElementById("add-tab-modal");
            addTabModal.classList.add("ACC_BUTTON_REQUEST_EDIT");

            var tabNameInput = addTabModal.children[0].children[1];
            tabNameInput.value = tabName;

            addTabModal.style.display = "block";

            // after display: block;
            tabNameInput.focus();
        })
    }

    var accButtonDelete = document.createElement("div");
    if (tabName != "ALL") {
        var accButtonDeleteText = document.createElement("div");
        accButtonDeleteText.classList.add("action-button-text");
        accButtonDeleteText.classList.add("delete-button-text");
        accButtonDeleteText.innerHTML = "&times;";

        accButtonDelete.classList.add("action-button");
        accButtonDelete.classList.add("acc-button-action");
        accButtonDelete.appendChild(accButtonDeleteText);
        accButtonDelete.addEventListener("click", function(e) {
            e.stopPropagation();

            var accDiv = this.parentElement.parentElement;
            var prevAccDiv = accDiv.previousElementSibling;

            accDiv.remove();

            var addPadding = false;
            reposNextElements(prevAccDiv, "ONE", addPadding);
        });
    }

    /*var accButton = document.createElement("button");*/
    accButton.classList.add("main-button");
    accButton.classList.add("acc-button");
    if (tabName == "ALL") {
        accButton.classList.add("all-button");
    }
    accButton.appendChild(accStateDiv);
    accButton.appendChild(accButtonLabel);
    accButton.appendChild(accButtonGrab);
    accButton.appendChild(accButtonEdit);
    accButton.appendChild(accButtonDelete);

    accButton.addEventListener("click", function() {
        if (! this.classList.contains("all-button")) {

            if (accDragFired) {
                accDragFired = false;
                return;
            }

            var accStateDiv = this.children[0];
            accStateDiv.classList.toggle("acc-state-open");

            var accDiv = this.parentElement;
            var addPadding;
            if (accStateDiv.classList.contains("acc-state-open")) {
                openAccordion(accDiv);
                addPadding = true;
            } else {
                closeAccordion(accDiv);
                addPadding = false;
            }
            reposNextElements(accDiv, "ONE", addPadding);

            writeLocalStorage();
        }
    });
}

function openAccordion(accDiv) {
    var accPanelDiv = accDiv.children[1];
    var sitesPanelDiv = accPanelDiv.children[1];
    var links = sitesPanelDiv.children;
    for (j = 0; j < links.length; j++) {
        links[j].classList.remove("main-tile-disabled");
    }
    var addSiteDiv = accPanelDiv.children[2];
    addSiteDiv.classList.remove("main-tile-disabled");
    var accDivHeight = accDiv.scrollHeight + ACC_SITES_PANEL_PADDING;
    accDiv.style.height = accDivHeight + "px";
    accDiv.style.overflow = "visible";
}

function closeAccordion(accDiv) {
    var accPanelDiv = accDiv.children[1];
    var sitesPanelDiv = accPanelDiv.children[1];
    var links = sitesPanelDiv.children;
    for (j = 0; j < links.length; j++) {
        links[j].classList.add("main-tile-disabled");
    }
    var addSiteDiv = accPanelDiv.children[2];
    addSiteDiv.classList.add("main-tile-disabled");
    var accDivHeight = ACC_DIV_CLOSED_HEIGHT;
    accDiv.style.height = accDivHeight + "px";
    accDiv.style.overflow = "hidden";
}

function reposNextElements(accDiv, type, addPadding) {
    // type and addPadding crafted by fine-tuning
    var offtop;
    switch (type) {
    case "ONE":
        offtop = accDiv.offsetTop;
        break;
    case "ALL":
        offtop = accDiv.offsetTop - window.pageYOffset;
        break;
    }
    if (type == "ONE" && addPadding == true) {
        offtop += ACC_SITES_PANEL_PADDING;
    }

    var allQueuedsHtmlClcn = document.getElementsByClassName("queued-element");
    allQueueds = [].slice.call(allQueuedsHtmlClcn);
    allQueueds.sort(function(a, b){
        var aTop = a.offsetTop;
        var bTop = b.offsetTop;
        return aTop - bTop;
    });

    var u;
    var queued;
    var accDivFound = false;
    for (u = 0; u < allQueueds.length && !accDivFound; ++u) {
        queued = allQueueds[u];
        if (queued === accDiv) {
            accDivFound = true;
        }
    }

    if (accDivFound) {
        for (;u < allQueueds.length; ++u) {
            switch (true) {
            case accDiv.classList.contains("all-div"):
                offtop += accDiv.scrollHeight;
                break;
            case accDiv.classList.contains("acc-div"):
                var accButton = accDiv.children[0];
                var accStateDiv = accButton.children[0];
                if (accStateDiv.classList.contains("acc-state-open")) {
                    offtop += accDiv.scrollHeight;
                    if (type == "ALL" && addPadding == true) {
                        offtop += ACC_SITES_PANEL_PADDING;
                    }
                    var accPanelDiv = accDiv.children[1];
                    var sitesPanelDiv = accPanelDiv.children[1];
                    if (sitesPanelDiv.children.length == 0) {
                        offtop += ACC_SITES_PANEL_PADDING;
                    }
                } else {
                    offtop += ACC_DIV_CLOSED_HEIGHT;
                }
                break;
            default:
                offtop += accDiv.scrollHeight;
            }
            accDiv = allQueueds[u];
            accDiv.style.top = offtop + "px";
        }
    }

}

function setDraggableAccDiv(accButtonGrab, accDiv) {
    var startY = 0, currentY = 0;
    var accDivStartY = 0;
    var lastAccDivStartY = 0;
    var swapAccDiv = null;
    var swapAccDivStartY = 0;
    var direction = null;

    accButtonGrab.onclick = function(e) {
        e.stopPropagation();
    }

    accButtonGrab.onmousedown = function(e) {
        e.stopPropagation();

        accDragFired = true;

        startDragAccDiv(e);
    }

    function wheelEventListener(e) {
        e.preventDefault();
    }

    function startDragAccDiv(e) {
        e = e || window.event;
        e.preventDefault();

        startY = e.clientY;
        currentY = startY;

        accDiv.classList.add("element-dragged");

        accDivStartY = accDiv.offsetTop;
        lastAccDivStartY = accDivStartY;

        document.onmousemove = dragAccDiv;
        document.onmouseup = stopDragAccDiv;

        window.addEventListener("wheel", wheelEventListener, { passive: false } );
    }

    function dragAccDiv(e) {
        e = e || window.event;
        e.preventDefault();

        var newY = currentY - e.clientY;
        currentY = e.clientY;

        accDiv.style.transition = "all 0s ease 0s";
        accDiv.style.top = (accDiv.offsetTop - newY) + "px";

        var accDivs = document.getElementsByClassName("queued-element");
        for (i = 0; i < accDivs.length; ++i) {
            var otherAccDiv = accDivs[i];
            if (otherAccDiv.classList.contains("acc-div")
                    && ! otherAccDiv.classList.contains("all-div")
                    && ! otherAccDiv.classList.contains("element-dragged")) {
                var otherMinY = otherAccDiv.offsetTop - window.pageYOffset;
                var otherMaxY = otherMinY + otherAccDiv.offsetHeight;
                if (otherAccDiv.classList.contains("element-swapped")) {
                    if (currentY <= (otherMinY - 20)
                            || currentY >= (otherMaxY - 20)) {
                        otherAccDiv.classList.remove("element-swapped");
                    }
                } else {
                    if (currentY >= (otherMinY - 20)
                            && currentY <= (otherMaxY - 20)) {
                        swapAccDiv = otherAccDiv;
                        swapAccDivStartY = swapAccDiv.offsetTop;
                        swapAccDiv.classList.add("element-swapped");

                        if (accDivStartY < swapAccDivStartY) {
                            direction = "down";
                        } else {
                            direction = "up";
                        }

                        var swapAccDivNewTop;
                        switch (direction) {
                        case "down":
                            swapAccDivNewTop = accDivStartY;
                            break;
                        case "up":
                            swapAccDivNewTop = swapAccDivStartY + accDiv.offsetHeight;
                            break;
                        }

                        swapAccDiv.style.top = swapAccDivNewTop + "px";

                        lastAccDivStartY = accDivStartY;
                        accDivStartY = accDivStartY + swapAccDiv.offsetHeight;
                    }
                }
            }
        }
    }

    function stopDragAccDiv(e) {
        e.stopPropagation();

        // ???
        setTimeout(function(){
            accDragFired = false;
        }, 100);

        var accDivNewTop;
        if (direction) {
            switch (direction) {
            case "down":
                accDivNewTop = lastAccDivStartY + swapAccDiv.offsetHeight;
                break;
            case "up":
                accDivNewTop = swapAccDivStartY;
                break;
            }
        } else {
            accDivNewTop = lastAccDivStartY;
        }

        accDiv.classList.remove("element-dragged");
        accDiv.style.transition = "var(--main-transition)";
        accDiv.style.top = accDivNewTop + "px";

        if (swapAccDiv) {
            swapAccDiv.classList.remove("element-swapped");
        }

        document.onmouseup = null;
        document.onmousemove = null;

        window.removeEventListener("wheel", wheelEventListener);

        writeLocalStorage();
    }
}

function setAccPanelDiv(accPanelDiv, tabData, tabName, tabState, addSiteModal) {
    var emptyDiv = document.createElement("div");

    var sitesPanelDiv = document.createElement("div");

    if (tabName != "ALL") {
        for (s = 1; s < tabData.length; s++) {  /* 0 already processed */
            var sitesData = tabData[s];
            var siteData = sitesData.split(ICON_START_CHAR);
            var siteName = siteData[0];
            var siteData = siteData[1].split(URL_START_CHAR);
            var siteIconType = siteData[0];
            var siteUrl = siteData[1];

            createSiteLinkA(sitesPanelDiv, tabState, s, siteName, siteIconType, siteUrl);
        }

        var addSiteIconDiv = document.createElement("div");
        addSiteIconDiv.classList.add("add-site-div-icon");
        addSiteIconDiv.innerHTML = "+";

        var addSiteDiv = document.createElement("div");
        addSiteDiv.classList.add("main-button");
        addSiteDiv.classList.add("main-tile");
        addSiteDiv.classList.add("add-site-div");
        addSiteDiv.classList.add("main-tile-disabled");
        addSiteDiv.appendChild(addSiteIconDiv);

        addSiteDiv.addEventListener("click", function() {
            var sitesPanelDivs = document.getElementsByClassName("SITE-PANEL-ACTIVE");
            for (p = 1; p < sitesPanelDivs.length; p++) {
                sitesPanelDivs[p].classList.remove("SITE-PANEL-ACTIVE");
            }
            sitesPanelDiv.classList.add("SITE-PANEL-ACTIVE");

            addSiteModal.classList.add("SITE_DIV_REQUEST_ADD");

            var siteNameInput = addSiteModal.children[0].children[1];
            siteNameInput.value = "";

            var siteUrlInput = addSiteModal.children[0].children[2];
            siteUrlInput.value = "";

            var radiosContainer = addSiteModal.children[0].children[3];

            var siteIconLinkRadio = radiosContainer.children[0];
            siteIconLinkRadio.checked = false;

            var siteIconInitRadio = radiosContainer.children[2];
            siteIconInitRadio.checked = false;

            var siteIconLinkLabel = radiosContainer.children[1];
            while (siteIconLinkLabel.firstChild) {
                siteIconLinkLabel.removeChild(siteIconLinkLabel.firstChild);
            }

            var siteIconInitLabel = radiosContainer.children[3];
            while (siteIconInitLabel.firstChild) {
                siteIconInitLabel.removeChild(siteIconInitLabel.firstChild);
            }

            addSiteModal.style.display = "block";

            // after display: block;
            siteNameInput.focus();
        });
    }

    /*var accPanelDiv = document.createElement("div");*/
    accPanelDiv.classList.add("acc-panel");
    accPanelDiv.style.maxHeight = "";
    accPanelDiv.appendChild(emptyDiv);
    accPanelDiv.appendChild(sitesPanelDiv);
    if (tabName != "ALL") {
        accPanelDiv.appendChild(addSiteDiv);
    }

    if (tabName != "ALL") {
        addSiteDiv.addEventListener("mouseenter",  function() {
            accPanelDiv.classList.add("acc-panel-selected");
            var accDiv = accPanelDiv.parentElement;
            accPanelDiv.style.maxHeight = accDiv.scrollHeight + "px";
            accPanelDiv.style.height = accDiv.scrollHeight + "px";
        });
        addSiteDiv.addEventListener("mouseleave",  function() {
            accPanelDiv.classList.remove("acc-panel-selected");
            accPanelDiv.style.maxHeight = "0px";
        });
    }
}

function createSiteLinkA(sitesPanelDiv, tabState, s, siteName, siteIconType, siteUrl) {
    switch (siteIconType) {
    case "link":
        var siteIconImg = document.createElement("img");
        siteIconImg.classList.add("site-icon-link");
        siteIconImg.rel = "shortcut icon";
        siteIconImg.src = getFavicon(siteUrl);
        siteIconImg.alt = siteName;
        break;
    case "init":
        var siteIconDiv = document.createElement("div");
        siteIconDiv.classList.add("site-icon-init");
        siteIconDiv.style.backgroundColor = getRandomColor();
        siteIconDiv.innerHTML = siteName.substr(0, 1).toUpperCase();
        break;
    }

    var siteNameDiv = document.createElement("a");
    siteNameDiv.classList.add("site-name");
    siteNameDiv.innerHTML = siteName;

    var siteUrlDiv = document.createElement("a");
    siteUrlDiv.classList.add("site-url");
    siteUrlDiv.innerHTML = siteUrl;

    var siteGrabDivText = document.createElement("div");
    siteGrabDivText.classList.add("action-button-text");
    siteGrabDivText.classList.add("grab-button-text");
    siteGrabDivText.innerHTML = "❖";

    var siteGrabDiv = document.createElement("div");
    siteGrabDiv.classList.add("action-button");
    siteGrabDiv.classList.add("site-link-action");
    siteGrabDiv.appendChild(siteGrabDivText);

    var accButtonEditText = document.createElement("div");
    accButtonEditText.classList.add("action-button-text");
    accButtonEditText.classList.add("edit-button-text");
    accButtonEditText.innerHTML = "🖉";

    var siteEditDiv = document.createElement("div");
    siteEditDiv.classList.add("action-button");
    siteEditDiv.classList.add("site-link-action");
    siteEditDiv.appendChild(accButtonEditText);
    siteEditDiv.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();

        var siteLinkAsToEdit = document.getElementsByClassName("SITE_LINK_A_TO_EDIT");
        for (s = 1; s < siteLinkAsToEdit.length; s++) {
            siteLinkAsToEdit[s].classList.remove("SITE_LINK_A_TO_EDIT");
        }

        var siteLinkA = this.parentElement;
        siteLinkA.classList.add("SITE_LINK_A_TO_EDIT");

        var addSiteModal = document.getElementById("add-site-modal");
        addSiteModal.classList.add("SITE_DIV_REQUEST_EDIT");

        var siteNameInput = addSiteModal.children[0].children[1];
        siteNameInput.value = siteName;

        var siteUrlInput = addSiteModal.children[0].children[2];
        siteUrlInput.value = siteUrl;

        var radiosContainer = addSiteModal.children[0].children[3];

        var siteIconLinkRadio = radiosContainer.children[0];
        var siteIconInitRadio = radiosContainer.children[2];

        switch (siteIconType) {
        case "link":
            siteIconLinkRadio.checked = true;
            break;
        case "init":
            siteIconInitRadio.checked = true;
            break;
        }

        var linkImg = document.createElement("img");
        linkImg.classList.add("site-icon-link");
        linkImg.src = getFavicon(siteUrl);

        var siteIconLinkLabel = radiosContainer.children[1];
        while (siteIconLinkLabel.firstChild) {
            siteIconLinkLabel.removeChild(siteIconLinkLabel.firstChild);
        }
        siteIconLinkLabel.appendChild(linkImg);

        var initDiv = document.createElement("div");
        initDiv.classList.add("site-icon-init");
        initDiv.style.backgroundColor = getRandomColor();
        initDiv.innerHTML = siteName.substr(0, 1).toUpperCase();

        var siteIconInitLabel = radiosContainer.children[3];
        while (siteIconInitLabel.firstChild) {
            siteIconInitLabel.removeChild(siteIconInitLabel.firstChild);
        }
        siteIconInitLabel.appendChild(initDiv);

        addSiteModal.style.display = "block";

        // after display: block;
        siteNameInput.focus();
    });

    var accButtonDeleteText = document.createElement("div");
    accButtonDeleteText.classList.add("action-button-text");
    accButtonDeleteText.classList.add("delete-button-text");
    accButtonDeleteText.innerHTML = "&times;";

    var siteDeleteDiv = document.createElement("div");
    siteDeleteDiv.classList.add("action-button");
    siteDeleteDiv.classList.add("site-link-action");
    siteDeleteDiv.appendChild(accButtonDeleteText);
    siteDeleteDiv.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();

        var siteLinkA = this.parentElement;
        var sitesPanelDiv = siteLinkA.parentElement;
        var accPanelDiv = sitesPanelDiv.parentElement;
        var accDiv = accPanelDiv.parentElement;

        siteLinkA.remove();

        var s;
        for (s = 1; s <= sitesPanelDiv.children.length; ++s) {

            otherSiteLinkA = sitesPanelDiv.children[s - 1];

            var cols = SITES_PANEL_COLS;
            var s0 = s - 1;
            var quotient = Math.floor(s0/cols);
            var remainder = s0 % cols;

            var ll = (remainder + 1) * (SITE_LINK_A_WIDTH + ACC_SITES_PANEL_PADDING);
            otherSiteLinkA.style.left = ll + "px";

            var tt = SITE_LINK_A_TOP + quotient * (SITE_LINK_A_HEIGHT + ACC_SITES_PANEL_PADDING);
            otherSiteLinkA.style.top = tt + "px";

        }

        if (sitesPanelDiv.children.length % 5 == 0) {
            sitesPanelDiv.style.height = "auto";
            accPanelDiv.style.height = "auto";
            accDiv.style.height = "auto";
            if (sitesPanelDiv.children.length > 0) {
                function f() {
                    var addPadding = true;
                    reposNextElements(accDiv, "ONE", addPadding);
                    accDiv.removeEventListener("transitionend", f);
                }
                accDiv.addEventListener("transitionend", f);
            } else {
                var addPadding = true;
                reposNextElements(accDiv, "ONE", addPadding);
            }
        }

        writeLocalStorage();
    });

    var siteLinkA = document.createElement("a");
    siteLinkA.classList.add("main-tile");
    siteLinkA.classList.add("site-link");
    siteLinkA.classList.add("main-tile-disabled");

    var cols = SITES_PANEL_COLS;
    var s0 = s - 1;
    var quotient = Math.floor(s0/cols);
    var remainder = s0 % cols;

    var ll = (remainder + 1) * (SITE_LINK_A_WIDTH + ACC_SITES_PANEL_PADDING);
    siteLinkA.style.left = ll + "px";

    var tt = SITE_LINK_A_TOP + quotient * (SITE_LINK_A_HEIGHT + ACC_SITES_PANEL_PADDING);
    siteLinkA.style.top = tt + "px";

    siteLinkA.href = siteUrl;
    siteLinkA.target = "_blank";

    switch (siteIconType) {
    case "link":
        siteLinkA.appendChild(siteIconImg);
        break;
    case "init":
        siteLinkA.appendChild(siteIconDiv);
        break;
    }

    siteLinkA.appendChild(siteNameDiv);
    siteLinkA.appendChild(siteGrabDiv);
    siteLinkA.appendChild(siteEditDiv);
    siteLinkA.appendChild(siteDeleteDiv);
    siteLinkA.appendChild(siteUrlDiv);

    setDraggableSiteLinkA(siteGrabDiv, siteLinkA, sitesPanelDiv);

    sitesPanelDiv.appendChild(siteLinkA);
}

function setDraggableSiteLinkA(siteGrabDiv, siteLinkA, sitesPanelDiv) {
    var spdMinX, spdMaxX;
    var spdMinY, spdMaxY;
    var startX = 0, currentX = 0;
    var startY = 0, currentY = 0;
    var siteLinkAStartX = 0, lastSiteLinkAStartX = 0;
    var siteLinkAStartY = 0, lastSiteLinkAStartY = 0;
    var swapSiteLinkA = null;
    var swapSiteLinkAStartX = null, swapSiteLinkAStartY = null;

    siteGrabDiv.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    siteGrabDiv.onmousedown = function(e) {
        e.preventDefault();
        e.stopPropagation();

        startDragSiteLinkA(e);
    }

    function wheelEventListener(e) {
        e.preventDefault();
    }

    function startDragSiteLinkA(e) {
        e = e || window.event;
        e.preventDefault();

        siteLinkA.classList.add("element-dragged");
        siteLinkA.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        spdMinX = sitesPanelDiv.offsetLeft;
        spdMaxX = spdMinX + sitesPanelDiv.offsetWidth;
        spdMinY = sitesPanelDiv.offsetTop;
        spdMaxY = spdMinY + sitesPanelDiv.offsetHeight;

        startX = e.clientX;
        currentX = startX;

        startY = e.clientY;
        currentY = startY;

        siteLinkAStartX = siteLinkA.offsetLeft;
        lastSiteLinkAStartX = siteLinkAStartX;

        siteLinkAStartY = siteLinkA.offsetTop;
        lastSiteLinkAStartY = siteLinkAStartY;

        document.onmousemove = dragSiteLinkA;
        document.onmouseup = stopDragSiteLinkA;

        window.addEventListener("wheel", wheelEventListener, { passive: false } );
    }

    function dragSiteLinkA(e) {
        e = e || window.event;
        e.preventDefault();

        var newX = currentX - e.clientX;
        currentX = e.clientX;

        var newY = currentY - e.clientY;
        currentY = e.clientY;

        if (! siteLinkAIsInParentDiv(siteLinkA, sitesPanelDiv)) {
            stopDragSiteLinkA(e);

            siteLinkA.onclick = preventDefault();

            setTimeout(function(){
                siteLinkA.onclick = null;
            }, 400);
        }

        siteLinkA.style.transition = "all 0s ease 0s";
        siteLinkA.style.left = (siteLinkA.offsetLeft - newX) + "px";
        siteLinkA.style.top = (siteLinkA.offsetTop - newY) + "px";

        var siteLinkAs = sitesPanelDiv.children;
        for (i = 0; i < siteLinkAs.length; ++i) {
            var otherSiteLinkA = siteLinkAs[i];
            if (! otherSiteLinkA.classList.contains("element-dragged")) {

                var r = otherSiteLinkA.getBoundingClientRect();
                otherMinX = r.left;
                otherMaxX = otherMinX + r.width;
                otherMinY = r.top;
                otherMaxY = otherMinY + r.height;

                if (otherSiteLinkA.classList.contains("element-swapped")) {
                    if (currentX <= (otherMinX - 20)
                            || currentX >= (otherMaxX - 20)
                            || currentY <= (otherMinY - 20)
                            || currentY >= (otherMaxY - 20)) {
                        otherSiteLinkA.classList.remove("element-swapped");
                    }
                } else {
                    if (currentX >= (otherMinX - 20)
                            && currentX <= (otherMaxX - 20)
                            && currentY >= (otherMinY - 20)
                            && currentY <= (otherMaxY - 20)) {
                        swapSiteLinkA = otherSiteLinkA;
                        swapSiteLinkAStartX = swapSiteLinkA.offsetLeft;
                        swapSiteLinkAStartY = swapSiteLinkA.offsetTop;
                        swapSiteLinkA.classList.add("element-swapped");

                        var swapSiteLinkANewLeft = siteLinkAStartX;
                        swapSiteLinkA.style.left = swapSiteLinkANewLeft + "px";
                        var swapSiteLinkANewTop = siteLinkAStartY;
                        swapSiteLinkA.style.top = swapSiteLinkANewTop + "px";

                        lastSiteLinkAStartX = siteLinkAStartX;
                        siteLinkAStartX = swapSiteLinkAStartX;
                        lastSiteLinkAStartY = siteLinkAStartY;
                        siteLinkAStartY = swapSiteLinkAStartY;
                    }
                }
            }
        }
    }

    function siteLinkAIsInParentDiv(siteLinkA, sitesPanelDiv) {
        var r1 = siteLinkA.getBoundingClientRect();
        var slaMinX = r1.left;
        var slaMaxX = slaMinX + r1.width;
        var slaMinY = r1.top;
        var slaMaxY = slaMinY + r1.height;

        var accDiv = sitesPanelDiv.parentElement.parentElement;
        var r2 = accDiv.getBoundingClientRect();
        var limitMinX = r2.left + 100;
        var limitMaxX = limitMinX + r2.width - 140;
        var limitMinY = r2.top - 10;
        var limitMaxY = limitMinY + r2.height + 60;

        return (slaMinX >= limitMinX && slaMaxX <= limitMaxX
                && slaMinY >= limitMinY && slaMaxY <= limitMaxY)
    }

    function stopDragSiteLinkA(e) {
        e.stopPropagation();

        var siteLinkANewLeft;
        var siteLinkANewTop;
        // duplicating test for Y is not necessary
        if (swapSiteLinkAStartX) {
            siteLinkANewLeft = swapSiteLinkAStartX;
            siteLinkANewTop = swapSiteLinkAStartY;
        } else {
            siteLinkANewLeft = lastSiteLinkAStartX;
            siteLinkANewTop = lastSiteLinkAStartY;
        }

        siteLinkA.classList.remove("element-dragged");
        siteLinkA.style.transition = "var(--main-transition)";
        siteLinkA.style.left = siteLinkANewLeft + "px";
        siteLinkA.style.top = siteLinkANewTop + "px";

        if (swapSiteLinkA) {
            swapSiteLinkA.classList.remove("element-swapped");
        }

        setTimeout(function(){
            siteLinkA.onclick = null;
        }, 100);

        document.onmouseup = null;
        document.onmousemove = null;

        window.removeEventListener("wheel", wheelEventListener);

        function f() {
            writeLocalStorage();
            siteLinkA.removeEventListener("transitionend", f);
        }
        siteLinkA.addEventListener("transitionend", f);

    }

}

function getFavicon(siteUrl) {
    if (siteUrl.length == 0) { return ""; }

    var a = siteUrl.split("//");
    if (a.length < 2) { return ""; }

    var http = a[0];

    var b = a[1].split("/");
    if (b.length == 0) { return ""; }

    var domain = b[0];

    return http + "//" + domain + "/favicon.ico";
}

function getRandomColor() {
    function c() {
        var hex = Math.floor(Math.random() * 256).toString(16);
        return ("0" + String(hex)).substr(-2); // pad with zero
    }
    return "#" + c() + c() + c();
}

function editTab(addTabModal) {
    var accButton = document.getElementsByClassName("ACC_BUTTON_TO_EDIT")[0];
    var accButtonLabel = accButton.children[1];
    var tabNameInput = addTabModal.children[0].children[1];
    accButtonLabel.innerHTML = tabNameInput.value;
    accButton.classList.remove("ACC_BUTTON_TO_EDIT");
}

function setWindowOnMouseDown(addSiteModal, addTabModal) {
    window.onmousedown = function(event) {
        if (event.target == addSiteModal) {
            addSiteModal.style.display = "none";
        }
        if (event.target == addTabModal) {
            addTabModal.style.display = "none";
        }
    }
}

function createAllDiv(addSiteModal) {
    tabData = [];
    tabName = "ALL";
    tabState = "";
    createAccDiv(tabData, tabName, tabState, addSiteModal);
}

function createAddTabDiv(addTabModal) {
    var addTabButton = document.createElement("button");
    addTabButton.classList.add("main-button");
    addTabButton.classList.add("add-tab-button");
    addTabButton.innerHTML = "+";

    addTabButton.addEventListener("click", function() {
        addTabModal.classList.add("ACC_BUTTON_REQUEST_ADD");

        var tabNameInput = addTabModal.children[0].children[1];
        tabNameInput.value = "";

        addTabModal.style.display = "block";

        // after display: block;
        tabNameInput.focus();
    });

    var addTabDiv = document.createElement("div");
    addTabDiv.classList.add("queued-element");
    addTabDiv.classList.add("add-tab-div");
    addTabDiv.appendChild(addTabButton);

    document.body.appendChild(addTabDiv);
}

function createEmptySpace() {
    for (i = 0; i < 10; i++) {
        var emptyDiv = document.createElement("div");
        emptyDiv.classList.add("queued-element");
        emptyDiv.classList.add("empty-div");
        emptyDiv.innerHTML = "&nbsp;";
        document.body.appendChild(emptyDiv);
    }
}

function checkAccButtons(accButtons) {
    // after the first creation of accButtons: needs accPanel.scrollHeight
    for (i = 0; i < accButtons.length; i++) {
        if (! accButtons[i].classList.contains("all-button")) {
            var accStateDiv = accButtons[i].children[0];
            var accDiv = accButtons[i].parentElement;
            if (accStateDiv.classList.contains("acc-state-open")) {
                openAccordion(accDiv);
            }
        }
    }
    var addPadding = false;
    reposAllElements(addPadding);
}

function reposAllElements(addPadding) {
    var accDiv = document.getElementsByClassName("queued-element")[0];
    reposNextElements(accDiv, "ALL", addPadding);
}

function checkAllButtonOpenClose(allButton) {
    var allStateDiv = allButton.children[0];
    var openAccs = document.getElementsByClassName("acc-state-open");
    if (openAccs.length > 0) {
        allStateDiv.classList.add("acc-state-open");
    } else {
        allStateDiv.classList.remove("acc-state-open");
    }
}

function setAllButtonClickListener(allButton, accButtons) {
    allButton.addEventListener("click", function() {
        var allStateDiv = this.children[0];
        if (allStateDiv.classList.contains("acc-state-open")) {
            closeAccordions(accButtons);
        } else {
            openAccordions(accButtons);
        }

        allStateDiv.classList.toggle("acc-state-open");

        writeLocalStorage();
    });
}

function closeAccordions(accButtons) {
    for (i = 0; i < accButtons.length; i++) {
        if (! accButtons[i].classList.contains("all-button")) {
            var accStateDiv = accButtons[i].children[0];
            var accDiv = accButtons[i].parentElement;
            if (accStateDiv.classList.contains("acc-state-open")) {
                accStateDiv.classList.remove("acc-state-open");
            }
            closeAccordion(accDiv);
        }
    }
    var addPadding = true;
    reposAllElements(addPadding);
}

function openAccordions(accButtons) {
    for (i = 0; i < accButtons.length; i++) {
        if (! accButtons[i].classList.contains("all-button")) {
            var accStateDiv = accButtons[i].children[0];
            accStateDiv.classList.add("acc-state-open");
            var accDiv = accButtons[i].parentElement;
            openAccordion(accDiv);
        }
    }
    var addPadding = true;
    reposAllElements(addPadding);
}

function setAllButtonOnfocusListener(allButton, addSiteModal, addTabModal) {
    allButton.addEventListener("focus", function() {
        if (addSiteModal.style.display = "block") {
            addSiteModal.style.display = "none";
        }
        if (addTabModal.style.display = "block") {
            addTabModal.style.display = "none";
        }
    });
}

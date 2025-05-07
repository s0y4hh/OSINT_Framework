document.addEventListener('DOMContentLoaded', function() {
    // --- Login/Register Page Animation ---
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');
    const authContainer = document.getElementById('authContainer');

    if (signUpButton && signInButton && authContainer) {
        signUpButton.addEventListener('click', () => authContainer.classList.add('right-panel-active'));
        signInButton.addEventListener('click', () => authContainer.classList.remove('right-panel-active'));
        if (window.location.hash === '#register') authContainer.classList.add('right-panel-active');
    }

    // --- Dashboard Theme Toggle ---
    const themeToggleCheckbox = document.getElementById('themeToggleCheckbox');
    const dashboardBody = document.querySelector('.dashboard-body');
    const themeLabel = document.querySelector('.theme-label-text');

    if (themeToggleCheckbox && dashboardBody && themeLabel) {
        const applyTheme = (theme) => {
            dashboardBody.classList.toggle('dark-mode', theme === 'dark');
            dashboardBody.classList.toggle('light-mode', theme === 'light');
            themeToggleCheckbox.checked = (theme === 'dark');
            themeLabel.textContent = (theme === 'dark') ? 'DARK' : 'LIGHT';
        };
        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);
        themeToggleCheckbox.addEventListener('change', () => {
            const newTheme = themeToggleCheckbox.checked ? 'dark' : 'light';
            applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    // --- Flash Message Auto-hide ---
    document.querySelectorAll('.flash-message').forEach(message => {
        setTimeout(() => {
            message.style.opacity = '0';
            setTimeout(() => message.parentNode && message.parentNode.removeChild(message), 600);
        }, 5000);
    });

    // --- OSINT Mind Map Logic ---
    const sidebarNav = document.querySelector('.sidebar-nav');
    const mindMapContainer = document.getElementById('mind-map-container');
    const mindMapLinesSVG = document.getElementById('mind-map-lines');
    const nodeTemplate = document.getElementById('mind-map-node-template');
    const osintDataScript = document.getElementById('osint-data');
    const dashboardContentArea = document.getElementById('dashboardContentArea'); // For scroll listening
    
    let fullOsintData = {};
    if (osintDataScript && osintDataScript.textContent) {
        try {
            fullOsintData = JSON.parse(osintDataScript.textContent);
        } catch (e) {
            console.error("Error parsing OSINT data JSON:", e);
            if(mindMapContainer) mindMapContainer.innerHTML = "<p>Error loading OSINT data structure.</p>";
        }
    } else {
        console.error("OSINT data script tag not found or empty.");
        if(mindMapContainer) mindMapContainer.innerHTML = "<p>OSINT data structure not found.</p>";
    }
    
    const categoryIconMapJS = { /* Keep the JS icon map from previous version */
        "Username": "fa-user-secret", "Email Address": "fa-envelope-open-text",
        "Domain Name": "fa-network-wired", "IP & MAC Address": "fa-laptop-code",
        "Images / Videos / Docs": "fa-photo-video", "Social Networks": "fa-users-cog",
        "Instant Messaging": "fa-comments", "People Search Engines": "fa-address-book",
        "Dating": "fa-heart", "Telephone Numbers": "fa-phone-square-alt",
        "Public Records": "fa-landmark", "Business Records": "fa-building",
        "Transportation": "fa-car-side", "Geolocation Tools / Maps": "fa-map-marked-alt",
        "Search Engines": "fa-search-plus", "Forums / Blogs / IRC": "fa-rss-square",
        "Archives": "fa-archive", "Language Translation": "fa-language",
        "Metadata": "fa-cogs", "Mobile Emulation": "fa-mobile-alt",
        "Terrorism": "fa-biohazard", "Dark Web": "fa-user-ninja",
        "Digital Currency": "fa-coins", "Classifieds": "fa-bullhorn",
        "Encoding / Decoding": "fa-terminal", "Tools": "fa-tools",
        "AI Tools": "fa-brain", "Malicious File Analysis": "fa-file-medical-alt",
        "Exploits & Advisories": "fa-shield-virus", "Threat Intelligence": "fa-chart-line",
        "OpSec": "fa-user-shield", "Documentation / Evidence Capture": "fa-camera-retro",
        "Training": "fa-graduation-cap"
    };

    let nodePositions = {}; 
    let uniqueNodeIdCounter = 0;
    const baseNodeWidth = 180; 
    const baseNodeHeight = 70; 
    const horizontalSpacing = 230; 
    const verticalSpacing = 45;
    let currentRootNodeId = null; // To keep track of the root for recentering

    function createNodeElement(nodeData, level, parentId = null) {
        const templateClone = nodeTemplate.content.cloneNode(true);
        const nodeElement = templateClone.querySelector('.mind-map-node');
        uniqueNodeIdCounter++;
        const sanitizedName = nodeData.name.replace(/[^a-zA-Z0-9_]/g, '-').replace(/^-+|-+$/g, '');
        const nodeId = `node-${sanitizedName || 'item'}-${level}-${uniqueNodeIdCounter}`;
        nodeElement.id = nodeId;
        nodeElement.dataset.nodeId = nodeId;
        nodeElement.dataset.name = nodeData.name;
        nodeElement.dataset.type = nodeData.type;
        nodeElement.dataset.level = level;
        if (parentId) nodeElement.dataset.parentId = parentId;
        if (nodeData.url) nodeElement.dataset.url = nodeData.url; // Store URL for search results

        nodeElement.querySelector('.node-label').textContent = nodeData.name;
        const typeIconEl = nodeElement.querySelector('.node-type-icon');
        let iconClass = 'fa-question-circle'; 
        if (nodeData.type === 'folder') {
            iconClass = nodeData.icon || categoryIconMapJS[nodeData.name] || 'fa-folder';
        } else if (nodeData.type === 'url') {
            iconClass = nodeData.icon || 'fa-link';
        } else if (nodeData.type === 'item') {
            iconClass = nodeData.icon || 'fa-file-alt';
        }
        if(typeIconEl) typeIconEl.innerHTML = `<i class="fas ${iconClass}"></i>`; 
        const childrenCountEl = nodeElement.querySelector('.node-children-count');
        if (nodeData.type === 'url') {
            nodeElement.classList.add('is-url');
            if(childrenCountEl) childrenCountEl.style.display = 'none';
            nodeElement.addEventListener('click', (e) => {
                e.stopPropagation(); 
                if (nodeData.url) window.open(nodeData.url, '_blank');
            });
        } else if (nodeData.type === 'folder') {
            nodeElement.classList.add('is-folder');
            const childrenCount = nodeData.children ? nodeData.children.length : 0;
            if(childrenCountEl) childrenCountEl.textContent = childrenCount > 0 ? `${childrenCount} items` : 'Empty';
            nodeElement.addEventListener('click', (e) => {
                e.stopPropagation(); 
                if (nodeElement.classList.contains('expanded')) {
                    collapseNode(nodeId);
                } else if (childrenCount > 0) {
                    expandNode(nodeId, nodeData.children, level + 1);
                }
            });
        } else { 
             nodeElement.classList.add('is-item');
             if(childrenCountEl) childrenCountEl.textContent = `Item`;
        }
        return nodeElement;
    }

    function positionNode(nodeElement, level, siblingIndex = 0, totalSiblings = 1, parentX = 0, parentY = 0, parentWidth = 0, parentHeight = 0) {
        let x, y;
        const containerScrollWidth = mindMapContainer.scrollWidth;
        const containerClientHeight = dashboardContentArea.clientHeight; // Use clientHeight for visible area
        
        const currentNodewidth = nodeElement.offsetWidth || baseNodeWidth;
        const currentNodeHeight = nodeElement.offsetHeight || baseNodeHeight;

        if (level === 0) { 
            x = 50 + dashboardContentArea.scrollLeft; // Adjust for current scrollLeft
            y = (containerClientHeight / 2) - (currentNodeHeight / 2) + dashboardContentArea.scrollTop; // Center in visible area
            nodeElement.classList.add('is-root');
            currentRootNodeId = nodeElement.id; // Track the root node
        } else {
            x = parentX + parentWidth + horizontalSpacing / 1.5; 
            let childrenBlockHeight = 0;
            for(let i = 0; i < totalSiblings; i++) {
                childrenBlockHeight += baseNodeHeight + (i > 0 ? verticalSpacing : 0);
            }
            const parentCenterY = parentY + parentHeight / 2;
            const startY = parentCenterY - (childrenBlockHeight / 2);
            y = startY;
            for(let i = 0; i < siblingIndex; i++) {
                y += baseNodeHeight + verticalSpacing;
            }
        }
        x = Math.max(10 + dashboardContentArea.scrollLeft, x); 
        y = Math.max(10 + dashboardContentArea.scrollTop, y); 

        nodeElement.style.left = `${x}px`;
        nodeElement.style.top = `${y}px`;
        nodePositions[nodeElement.id] = { 
            x, y, element: nodeElement, level, name: nodeElement.dataset.name,
            width: currentNodewidth, height: currentNodeHeight
        };
    }

    function recenterRootNode() {
        if (currentRootNodeId && nodePositions[currentRootNodeId]) {
            const rootNode = nodePositions[currentRootNodeId];
            const containerClientHeight = dashboardContentArea.clientHeight;
            const scrollTop = dashboardContentArea.scrollTop;
            const scrollLeft = dashboardContentArea.scrollLeft;

            rootNode.y = (containerClientHeight / 2) - (rootNode.height / 2) + scrollTop;
            rootNode.x = 50 + scrollLeft; // Keep it to the left, adjusted for horizontal scroll
            
            rootNode.element.style.top = `${rootNode.y}px`;
            rootNode.element.style.left = `${rootNode.x}px`;
            
            // After recentering root, all lines might need to be redrawn
            // or only lines connected to root and its direct children if other nodes are fixed relative to parent
            redrawAllLines(); 
        }
    }
    if(dashboardContentArea) {
        dashboardContentArea.addEventListener('scroll', recenterRootNode);
    }
    
    function drawLine(fromNodeId, toNodeId) { /* ... (keep as is) ... */ 
        const fromNode = nodePositions[fromNodeId];
        const toNode = nodePositions[toNodeId];
        if (!fromNode || !toNode) return;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        const x1 = fromNode.x + fromNode.width; 
        const y1 = fromNode.y + fromNode.height / 2;
        const x2 = toNode.x; 
        const y2 = toNode.y + toNode.height / 2;
        line.setAttribute('x1', x1); line.setAttribute('y1', y1);
        line.setAttribute('x2', x2); line.setAttribute('y2', y2);
        line.setAttribute('class', 'mind-map-line');
        line.setAttribute('marker-end', 'url(#arrow)');
        line.dataset.from = fromNodeId; 
        line.dataset.to = toNodeId;
        mindMapLinesSVG.appendChild(line);
    }
    function defineArrowMarker() { /* ... (keep as is) ... */ 
        if (mindMapLinesSVG.querySelector('#arrow')) return;
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'arrow'); marker.setAttribute('viewBox', '0 0 10 10');
        marker.setAttribute('refX', '9'); marker.setAttribute('refY', '5');
        marker.setAttribute('markerWidth', '6'); marker.setAttribute('markerHeight', '6');
        marker.setAttribute('orient', 'auto-start-reverse'); marker.setAttribute('class', 'mind-map-arrow-marker');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
        marker.appendChild(path); defs.appendChild(marker);
        mindMapLinesSVG.insertBefore(defs, mindMapLinesSVG.firstChild);
    }
    function removeChildrenRecursive(parentNodeId) { /* ... (keep as is) ... */ 
        const childrenToRemove = [];
        Object.keys(nodePositions).forEach(nodeIdKey => {
            const node = nodePositions[nodeIdKey];
            if (node && node.element.dataset.parentId === parentNodeId) {
                childrenToRemove.push(nodeIdKey);
                if (node.element.classList.contains('expanded')) {
                    removeChildrenRecursive(nodeIdKey); 
                }
            }
        });
        childrenToRemove.forEach(idToRemove => {
            if (nodePositions[idToRemove]) {
                nodePositions[idToRemove].element.remove();
                delete nodePositions[idToRemove];
            }
        });
        mindMapLinesSVG.querySelectorAll(`line[data-from="${parentNodeId}"]`).forEach(l => {
            if (childrenToRemove.includes(l.dataset.to)) {
                l.remove();
            }
        });
    }
    function collapseNode(parentNodeId) { /* ... (keep as is) ... */ 
        const parentNodePos = nodePositions[parentNodeId];
        if (!parentNodePos || !parentNodePos.element.classList.contains('expanded')) return;
        removeChildrenRecursive(parentNodeId);
        parentNodePos.element.classList.remove('expanded');
    }
    function expandNode(parentNodeId, childrenData, level) { /* ... (keep as is) ... */ 
        const parentNodePos = nodePositions[parentNodeId];
        if (!parentNodePos || parentNodePos.element.classList.contains('expanded')) return;
        parentNodePos.element.classList.add('expanded');
        childrenData.forEach((childData, index) => {
            const childElement = createNodeElement(childData, level, parentNodeId);
            mindMapContainer.appendChild(childElement);
            positionNode(childElement, level, index, childrenData.length, parentNodePos.x, parentNodePos.y, parentNodePos.width, parentNodePos.height);
            drawLine(parentNodeId, childElement.id);
        });
    }
    function redrawAllLines() { /* ... (keep as is) ... */ 
        mindMapLinesSVG.innerHTML = ''; 
        defineArrowMarker(); 
        Object.keys(nodePositions).forEach(nodeId => {
            const node = nodePositions[nodeId];
            if (node && node.element.dataset.parentId) {
                const parentId = node.element.dataset.parentId;
                if (nodePositions[parentId]) { 
                    drawLine(parentId, nodeId);
                }
            }
        });
    }

    function renderMindMap(rootCategoryName, targetNodePath = null) {
        mindMapContainer.innerHTML = ''; 
        mindMapLinesSVG.innerHTML = ''; 
        defineArrowMarker(); 
        nodePositions = {};
        uniqueNodeIdCounter = 0;
        currentRootNodeId = null; // Reset current root

        const placeholder = document.getElementById('mind-map-placeholder');
        if(placeholder) placeholder.style.display = 'none';

        let rootNodeDataToRender = null;
        let pathToExpand = [];

        if (targetNodePath) { // Coming from search result
            const pathParts = targetNodePath.split(' > ');
            rootCategoryName = pathParts[0]; // The actual top-level category
            let currentLevelData = fullOsintData.children.find(cat => cat.name === rootCategoryName);
            if(currentLevelData) {
                rootNodeDataToRender = { ...currentLevelData }; // Clone to avoid modifying original
                if (categoryIconMapJS[rootNodeDataToRender.name]) {
                     rootNodeDataToRender.icon = categoryIconMapJS[rootNodeDataToRender.name];
                }
                pathToExpand = pathParts.slice(1);
            }
        } else if (fullOsintData && fullOsintData.children) { // Coming from sidebar click
            rootNodeDataToRender = fullOsintData.children.find(cat => cat.name === rootCategoryName);
            if (rootNodeDataToRender && categoryIconMapJS[rootNodeDataToRender.name]) {
                rootNodeDataToRender.icon = categoryIconMapJS[rootNodeDataToRender.name];
            }
        }


        if (rootNodeDataToRender) {
            const rootElement = createNodeElement(rootNodeDataToRender, 0);
            mindMapContainer.appendChild(rootElement);
            positionNode(rootElement, 0); 
            currentRootNodeId = rootElement.id; // Set current root

            if (rootNodeDataToRender.children && rootNodeDataToRender.children.length > 0) {
                if (pathToExpand.length > 0) {
                    // Expand along the path
                    let parentIdForExpansion = rootElement.id;
                    let childrenForNextLevel = rootNodeDataToRender.children;
                    for (let i = 0; i < pathToExpand.length; i++) {
                        const nodeNameToFind = pathToExpand[i];
                        const nodeToExpand = childrenForNextLevel.find(child => child.name === nodeNameToFind);
                        if (nodeToExpand) {
                            expandNode(parentIdForExpansion, childrenForNextLevel, i + 1); // Expand current level
                            // Find the DOM element for nodeToExpand to get its ID for the next parentId
                            const expandedNodeElement = Array.from(mindMapContainer.querySelectorAll(`[data-name="${nodeNameToFind}"][data-level="${i+1}"][data-parent-id="${parentIdForExpansion}"]`)).pop();
                            if(expandedNodeElement){
                                parentIdForExpansion = expandedNodeElement.id;
                                childrenForNextLevel = nodeToExpand.children;
                                if (!childrenForNextLevel || childrenForNextLevel.length === 0) break; // Stop if no more children
                            } else { break; }
                        } else { break; } // Path broken
                    }
                } else {
                    // Default expansion for sidebar click
                    expandNode(rootElement.id, rootNodeDataToRender.children, 1);
                }
            }
             // Initial recenter after rendering
            setTimeout(recenterRootNode, 50);
        } else {
            if(placeholder) {
                placeholder.innerHTML = `<p>Category "${rootCategoryName}" not found.</p>`;
                placeholder.style.display = 'block';
            } else {
                mindMapContainer.innerHTML = `<p>Category "${rootCategoryName}" not found.</p>`;
            }
        }
    }

    if (sidebarNav) {
        sidebarNav.addEventListener('click', function(event) {
            const targetNavItem = event.target.closest('.nav-item');
            if (!targetNavItem) return;
            event.preventDefault();
            sidebarNav.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            targetNavItem.classList.add('active');
            const categoryName = targetNavItem.dataset.categoryName;
            renderMindMap(categoryName);
        });
    }
    
    const defaultActiveSidebarItem = sidebarNav ? sidebarNav.querySelector('.nav-item.active') : null;
    if (defaultActiveSidebarItem) {
        renderMindMap(defaultActiveSidebarItem.dataset.categoryName);
    } else if (sidebarNav && sidebarNav.querySelector('.nav-item')) {
        const firstNavItem = sidebarNav.querySelector('.nav-item');
        if (firstNavItem) { 
            firstNavItem.classList.add('active'); 
            renderMindMap(firstNavItem.dataset.categoryName);
        }
    }

    // --- Search Functionality ---
    const searchBar = document.getElementById('headerSearchBar');
    const searchResultsDropdown = document.getElementById('searchResultsDropdown');

    function searchOsintData(query) {
        const results = [];
        if (!query || query.length < 2) return results; // Min query length
        const lowerQuery = query.toLowerCase();

        function findRecursive(items, path) {
            if (!items) return;
            items.forEach(item => {
                const currentPath = path ? `${path} > ${item.name}` : item.name;
                if (item.name.toLowerCase().includes(lowerQuery)) {
                    results.push({ name: item.name, type: item.type, url: item.url, path: currentPath, data: item });
                }
                if (item.children) {
                    findRecursive(item.children, currentPath);
                }
            });
        }
        if (fullOsintData.children) {
            findRecursive(fullOsintData.children, "");
        }
        return results.slice(0, 10); // Limit to 10 results
    }

    function displaySearchResults(results) {
        searchResultsDropdown.innerHTML = '';
        if (results.length === 0) {
            searchResultsDropdown.style.display = 'none';
            return;
        }
        results.forEach(result => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('result-item');
            let iconClass = 'fa-question-circle';
            if (result.type === 'folder') iconClass = categoryIconMapJS[result.name] || 'fa-folder';
            else if (result.type === 'url') iconClass = 'fa-link';
            itemDiv.innerHTML = `<i class="fas ${iconClass}"></i> ${result.name} <span class="item-path">${result.path.split(' > ').slice(0,-1).join(' > ')}</span>`;
            
            itemDiv.addEventListener('click', () => {
                if (result.type === 'url' && result.url) {
                    window.open(result.url, '_blank');
                } else if (result.type === 'folder') {
                    // Render mind map starting from the top-level category of this result
                    // and try to expand to the clicked folder.
                    const topLevelCategoryName = result.path.split(' > ')[0];
                    renderMindMap(topLevelCategoryName, result.path); 
                    
                    // Highlight the corresponding sidebar item
                    const sidebarItems = sidebarNav.querySelectorAll('.nav-item');
                    sidebarItems.forEach(si => {
                        si.classList.toggle('active', si.dataset.categoryName === topLevelCategoryName);
                    });
                }
                searchResultsDropdown.style.display = 'none';
                searchBar.value = ''; // Clear search bar
            });
            searchResultsDropdown.appendChild(itemDiv);
        });
        searchResultsDropdown.style.display = 'block';
    }

    if (searchBar && searchResultsDropdown) {
        searchBar.addEventListener('input', function() {
            const query = this.value;
            if (query.length > 1) {
                const results = searchOsintData(query);
                displaySearchResults(results);
            } else {
                searchResultsDropdown.style.display = 'none';
            }
        });
        // Hide dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (!searchBar.contains(event.target) && !searchResultsDropdown.contains(event.target)) {
                searchResultsDropdown.style.display = 'none';
            }
        });
    }

    // --- Sidebar Toggle ---
    const sidebar = document.querySelector('.dashboard-sidebar');
    const sidebarToggleButton = document.querySelector('.sidebar-toggle-btn');
    const mainDashboardArea = document.querySelector('.dashboard-main'); 
    
    if (sidebar && sidebarToggleButton && mainDashboardArea) {
        sidebarToggleButton.addEventListener('click', () => {
            if (window.innerWidth > 768) {
                sidebar.classList.toggle('collapsed');
                mainDashboardArea.classList.toggle('sidebar-collapsed'); 
            } else {
                sidebar.classList.toggle('open');
            }
            setTimeout(recenterRootNode, 310); // Recenter after animation
        });
    }
    
    document.addEventListener('click', function(event) {
        if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('open')) {
            const isClickInsideSidebar = sidebar.contains(event.target);
            const isClickOnToggleButton = sidebarToggleButton ? sidebarToggleButton.contains(event.target) : false;
            if (!isClickInsideSidebar && !isClickOnToggleButton) {
                sidebar.classList.remove('open');
            }
        }
    });
});

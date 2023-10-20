class SarinTreeView{

    static #DEFAULT_OPTIONS = {
        items              : [],
        selected           : [],
        hasSearch          : true,
        searchSelector     : null,
        hasFilter          : true,
        filterSelector     : null,
        hasCollapse        : true,
        hasIcon            : true,
        hasArrow           : true,
        clickable          : true,
        middleClick        : true,
        multiSelect        : true,
        searchPlaceholder  : 'search',
        clearButtonText    : 'clear',
        collapseButtonText : '⇓',
        direction          : 'ltr',
        allActive          : false,
        parentActive       : true,
        indent             : 1,
        collapse           : true,
        actions            : []
    }

    static #target
    static #selector
    static #treeViewConElem
    static #filterContainerElem
    static #searchElem
    static #filterElem
    static #filterUlElem
    static #clickedItems = []
    static #openedItems = []
    static #items = []
    static selected = []
    static items
    static hasSearch
    static searchSelector
    static hasFilter
    static filterSelector
    static hasCollapse
    static hasIcon
    static hasArrow
    static clickable
    static middleClick
    static multiSelect
    static searchPlaceholder
    static clearButtonText
    static collapseButtonText
    static direction
    static allActive
    static parentActive
    static indent
    static collapse
    static actions
    static renderCount = 0


    static init( selector ,options )
    {
        if( !this.checkElem(selector) )
            throw new Error('Target Not Found!');

        this.updateOption(options)
        this.environmentPreparation()
        this.createRoot()
        this.createContainers()
        this.render()
        this.eventJustOnce()
    }

    static checkElem(selector)
    {
        this.#selector = selector
        const element  = document.querySelector( selector );
        return typeof (element) != 'undefined' && element != null;
    }

    static createRoot()
    {
        this.#target = this.createElem('div' ,`sarin-tree-view-root ${this.clickable ? 'clickable' : ''}` )
        document.querySelector( this.#selector ).append(this.#target)
    }

    static updateOption(options)
    {
        Object.entries(this.#DEFAULT_OPTIONS).forEach(([key, value]) => {
            this[key] = key in options ? options[key] : value
        })
        this.#items = this.items
    }

    static environmentPreparation()
    {
        if (this.middleClick)
            document.body.onmousedown = function(e) {
                if(e.button === 1) {
                    e.preventDefault();
                    return false;
                }
            }
    }

    static createContainers()
    {
        this.createFiltersContainer()
        this.createFilterDom()
        this.createSearchDom()
        this.createTreeViewDom()
    }

    static createFiltersContainer()
    {
        if((this.hasFilter || this.hasSearch) && !this.searchSelector || !this.filterSelector  ){
            this.#filterContainerElem = this.createElem("div" ,`sarin-filters-root`)
            this.#target.append(
                this.#filterContainerElem
            )
        }
    }

    static createFilterDom()
    {
        if(this.hasFilter){
            this.#filterElem   = this.createElem("div" ,`sarin-filter-con sarin-${this.direction}`)
            this.#filterUlElem = this.createElem("ul"  ,'sarin-filter-ul')
            this.#filterElem.append( this.#filterUlElem )
            if( this.filterSelector ){
                const dynamicFilter = document.querySelector(this.filterSelector)
                 if (dynamicFilter)
                     dynamicFilter.append( this.#filterElem )
            }
            else{
                this.#filterContainerElem.append(
                    this.#filterElem
                )
            }
        }
    }

    static createSearchDom()
    {
        if(this.hasSearch){
            const searchCon   = this.createElem("div"    ,`sarin-search-con sarin-${this.direction} normal ${this.allActive ? 'expanded' : 'collapsed'}`)
            const searchInput = this.createElem("input"  ,'sarin-search-input' ,null,{placeholder:this.searchPlaceholder})
            const searchClear = this.createElem("button" ,'sarin-search-clear-btn' ,this.clearButtonText)
            searchCon.append(searchInput)
            searchCon.append(searchClear)

            if(this.hasCollapse) {
                const expandOrCollapse = this.createElem("button", 'sarin-expand-collapse' ,this.collapseButtonText)
                searchCon.append(expandOrCollapse)
            }
            this.#searchElem = searchCon;

            if( this.searchSelector ){
                const dynamicSearch = document.querySelector(this.searchSelector)
                if (dynamicSearch)
                    dynamicSearch.append( this.#searchElem )
            }
            else{
                this.#filterContainerElem.append(
                    this.#searchElem
                )
            }
        }
    }

    static createTreeViewDom()
    {
        this.#treeViewConElem = this.createElem('div' ,`sarin-tree-view-items-con sarin-${this.direction} indent-${this.indent}`)
        this.#target.append(
            this.#treeViewConElem
        )
    }

    static createElem(tag ,classItem = null ,innerHTML = null ,attributes = null ){
        const elem = document.createElement(tag)

        if(classItem)
            elem.className += classItem

        if(innerHTML)
            elem.innerHTML = innerHTML

        if(attributes)
            for(const key in attributes) elem.setAttribute(key, attributes[key])

        return elem;
    }

    static render(search = false)
    {
        this.reset()
        this.html(search)
        this.eventOnEveryRender()
        this.renderCount++;
    }

    static reset()
    {
        this.#treeViewConElem.innerHTML = ''
    }

    static html(search)
    {
        const loop = (items ,parent_id ) => {
            if( typeof(items) !== 'undefined' && items ){
                items.forEach( item => {
                    if( !this.renderCount )
                        this.selectedItems(item) && this.#clickedItems.push( this.object(item) )

                    if( typeof(item.nodes) == 'object' && !search ){
                        this.item(item ,parent_id ,search )
                        loop(item.nodes ,item.id )
                    }
                    else{
                        this.item(item ,parent_id ,search ,true)
                    }
                })
            }
        }
        loop( this.#items ,null)
    }


    static item(data ,parent_id ,search ,child = null )
    {
        const div = this.createElem(
            'div',
            `tree-view-item ${this.containClicked(data)} ${this.containOpened(data)} `+
            `${!child && data.nodes ? ` has-children` :( !child ? ` empty-children`: ` child` )}`+
            `${this.allActive ? ` opened` : `` }`,
            null,
            {'data-node-id':data.id,'data-node-type':data.node_type }
        )
        const wrap = this.createElem(
            'div',
            'contentWrapper'
        );
        div.append(wrap)

        if( !search )
            div.append(
                this.createElem(
                    'div',
                    `childrenWrapper`,
                )
            )

        if( this.hasArrow && !child && !search)
            wrap.append(
                this.createElem(
                    'button',
                    'arrow right'
                )
            )

        if( this.hasIcon )
            wrap.appendChild( this.createElem('i' ,data.icon) )

        wrap.appendChild( this.createElem('span' ,'title' ,data.name  ))

        if( this.actions )
            wrap.appendChild( this.appendCustomElement(data) )

        if(parent_id && !search ){
            this.#treeViewConElem.querySelector(`.tree-view-item[data-node-id="${parent_id}"][data-node-type="zone"] .childrenWrapper`).append(div)
        }
        else{
            div.className += ' fixed-active'
            if( this.parentActive )
                div.className += ' opened'

            this.#treeViewConElem.append( div )
        }
    }

    static appendCustomElement(data)
    {
        const actionsWrapper = this.createElem(
            'div',
            'actions'
        );
        this.actions.forEach(item => {
            let conditionStatus = true;
            for (const condition of item.conditions) {
                for (const conditionKey in condition) {
                    if( data[conditionKey] === undefined || !condition[conditionKey].includes( data[conditionKey] ) )
                        conditionStatus = false;
                }
            }
            if(conditionStatus){
                const attributes     = item.attributes;
                attributes.node_id   = data.id
                attributes.node_type = data.node_type
                actionsWrapper.appendChild(
                    this.createElem( item.tag ,item.classes ,item.html ,attributes )
                )
            }
        })
        return actionsWrapper;
    }

    static eventOnEveryRender()
    {
        if( this.clickable ){
            const clickToggle = document.querySelectorAll('.sarin-tree-view-root .tree-view-item span.title')
            clickToggle.forEach(elem => {

                elem.addEventListener('click' ,e => clickEventFunc(e))
                if(this.middleClick)
                    elem.addEventListener('auxclick' ,e => clickEventFunc(e ,'auxclick'))

                const clickEventFunc = async (e ,type = 'click') => {
                    const id = this.getDataAttributeOnEvent(e, 'data-node-id')
                    const node_type = this.getDataAttributeOnEvent(e, 'data-node-type')
                    const item = await this.findItem(id, node_type)
                    const exist = await this.#clickedItems.find(node => node.id === item.id && node.node_type === item.node_type);

                    if (type === 'click') {
                        if (exist) {
                            this.#clickedItems = this.filter(this.#clickedItems, node_type, id)
                            this.toggleClickedClassWrapper(item, false)
                        } else if (this.multiSelect) {
                            this.#clickedItems.push(this.object(item))
                            this.toggleClickedClassWrapper(item)
                        } else {
                            this.#clickedItems = [this.object(item)]
                            this.clearClickedClassWrapper()
                            this.toggleClickedClassWrapper(item)
                        }
                    }else if (type === 'auxclick') {
                        e.preventDefault();
                        if (e.button === 1){
                            if (exist) {
                                this.#clickedItems = [];
                                this.clearClickedClassWrapper()
                                this.toggleClickedClassWrapper(item, false)
                            }
                            else {
                                this.#clickedItems = [this.object(item)]
                                this.clearClickedClassWrapper()
                                this.toggleClickedClassWrapper(item)
                            }
                        }
                    }

                    this.filterUpdate()
                    window.dispatchEvent(
                        new CustomEvent(`${this.#selector}--clicked`, {
                            detail: {
                                affected: item,
                                items: this.#clickedItems,
                            }
                        })
                    );
                }

            })
        }


        if(this.hasArrow){
            const openToggle  = document.querySelectorAll('.sarin-tree-view-items-con .has-children button.arrow')
            openToggle.forEach(elem => {
                elem.addEventListener('click' ,async e => {
                    const id         = this.getDataAttributeOnEvent( e ,'data-node-id')
                    const node_type  = this.getDataAttributeOnEvent( e ,'data-node-type')
                    const current    = document.querySelector(`.tree-view-item[data-node-id="${id}"][data-node-type="${node_type}"]`);
                    const item       = await this.findItem(id ,node_type)

                    if (current.classList.contains('opened')) {
                        this.#openedItems = this.#openedItems.filter(node => node.id !== Number(item.id) && node.node_type === item.node_type )
                        current.classList.remove('opened')
                        this.toggleActiveChildrenClass(id ,node_type , false)

                    }else {
                        this.#openedItems.push(this.object(item))
                        current.classList.add('opened')
                        this.toggleActiveChildrenClass(id ,node_type)
                    }

                    window.dispatchEvent(
                        new CustomEvent(`${this.#selector}--toggled` ,{
                            detail: {
                                affected: item,
                                items: this.#openedItems,
                            }
                        })
                    );
                })
            })
        }

        this.filterUpdate()
    }


    static filterUpdate()
    {
        this.#filterUlElem.innerHTML = ''
        this.#clickedItems.forEach( item => {
            const div = this.createElem(
                'li',
                'filter-item',
                null,
                {'data-node-id':item.id,'data-node-type':item.node_type }
            )
            div.append(this.createElem(
                'p',
                null,
                item.data.name,
            ))
            div.append(this.createElem(
                'button',
                'filter-remove',
                '✕'
            ))
            this.#filterUlElem.append(
                div
            )
        })
        this.filterEvent()
    }


    static filterEvent()
    {
        if( this.hasFilter ){
            const closeFilter = document.querySelectorAll('.sarin-filter-con .filter-item button')
            closeFilter.forEach(elem => {
                elem.addEventListener('click' ,e => clickEventFunc(e))
                if(this.middleClick)
                    elem.addEventListener('auxclick' ,e => clickEventFunc(e ,'auxclick'))

                const clickEventFunc = async (e ,type = 'click') => {
                    const node_id   = elem.parentElement.getAttribute('data-node-id')
                    const node_type = elem.parentElement.getAttribute('data-node-type')

                    if (type === 'click') {
                        this.#clickedItems = this.#clickedItems.filter(node => node.node_type !== node_type || node.id !== Number(node_id) )
                        const specific     = this.#treeViewConElem.querySelector(`.tree-view-item[data-node-id="${node_id}"][data-node-type="${node_type}"]`);
                        specific && specific.classList.remove('clicked')

                    }else if (type === 'auxclick') {
                        e.preventDefault();
                        if (e.button === 1){
                            this.#clickedItems = [];
                            this.clearClickedClassWrapper()
                        }
                    }

                    this.filterUpdate()
                    window.dispatchEvent(
                        new CustomEvent(`${this.#selector}--filter-remove` ,{
                            detail: {
                                affected: await this.find(node_id ,node_type),
                                items: this.#clickedItems,
                            }
                        })
                    );
                }


            })
        }
    }

    static eventJustOnce()
    {
        if(this.hasCollapse){
            const expandOrCollapse = document.querySelector('button.sarin-expand-collapse')
            expandOrCollapse.addEventListener('click' ,e => {
                if( this.#searchElem.classList.contains('normal')){
                    let collapseStat = 'collapsed';
                    const items      = this.#target.querySelectorAll('.tree-view-item.has-children')

                    if(this.#searchElem.classList.contains('collapsed')){
                        items.forEach( elem =>{
                            if( !elem.classList.contains('opened') )
                                elem.classList.add('opened')
                        })

                        this.#searchElem.classList.remove('collapsed')
                        this.#searchElem.classList.add('expanded')
                        collapseStat = 'expanded'

                    }else{
                        items.forEach( elem => {
                            if( elem.classList.contains('opened') )
                                elem.classList.remove('opened')
                        })

                        this.#searchElem.classList.remove('expanded')
                        this.#searchElem.classList.add('collapsed')
                    }

                    window.dispatchEvent(
                        new CustomEvent(`${this.#selector}--${collapseStat}`)
                    );
                }
            })
        }


        if(this.hasSearch){
            const searchInput = document.querySelector('.sarin-search-con input')
            const clearButton = document.querySelector('.sarin-search-con button')

            searchInput.addEventListener('keyup' ,e => {
                const keyword = e.target.value.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '')

                if(keyword){

                    if(this.#searchElem.classList.contains('normal')){
                        this.#searchElem.classList.remove('normal')
                        this.#searchElem.classList.add('searched')
                    }

                    if(this.#searchElem.classList.contains('expanded')){
                        this.#searchElem.classList.remove('expanded')
                        this.#searchElem.classList.add('collapsed')
                    }

                    this.#items = this.searchByText( keyword )
                    this.render(true)
                }else{
                    if(this.#searchElem.classList.contains('searched')){
                        this.#searchElem.classList.remove('searched')
                        this.#searchElem.classList.add('normal')
                    }
                    this.#items = this.items
                    this.render()
                }
            })

            clearButton.addEventListener('click' ,e => {
                if ( this.#searchElem.classList.contains('searched') ){
                    this.#items = this.items
                    searchInput.value = ''
                    this.#searchElem.classList.remove('searched')
                    this.#searchElem.classList.add('normal')
                    this.render()
                }
            })

        }
    }


    static findItem(id ,node_type)
    {
        let data;
        const loop = (items) => {
            if( typeof(items) !== 'undefined' && items ){
                items.forEach( item  => {
                    if( Number(item.id) === Number(id) && item.node_type === node_type){
                        data = item;
                        return;
                    }
                    if( typeof(item.nodes) == 'object'){
                        loop(item.nodes)
                    }
                })
            }
        }
        loop( this.items)
        return data;
    }

    static searchByText( keyword )
    {
        let data = [];
        const loop = (items) => {
            if( typeof(items) !== 'undefined' && items ){
                items.forEach( item  => {
                    if( item.name.search( keyword ) >= 0 ){
                        data.push(item);
                    }
                    if( typeof(item.nodes) == 'object'){
                        loop(item.nodes)
                    }
                })
            }
        }
        loop(this.items)
        return data;
    }

    static clearClickedClassWrapper()
    {
        const elements = this.#treeViewConElem.querySelectorAll(`.tree-view-item`)
        elements.forEach(elem => elem.classList.remove('clicked'))
    }

    static toggleClickedClassWrapper( item ,addClass = true )
    {
        const element = this.#treeViewConElem.querySelector(`.tree-view-item[data-node-id="${item.id}"][data-node-type="${item.node_type}"]`);
        addClass
            ? element.classList.add('clicked')
            : element.classList.remove('clicked')
    }


    static toggleActiveChildrenClass( id ,node_type ,openClass = true )
    {
        const children = this.#treeViewConElem.querySelectorAll(`.has-children[data-node-id="${id}"][data-node-type="${node_type}"]>.childrenWrapper>.tree-view-item`);
        children.length && children.forEach( i => {
            if( openClass ){
                i.classList.add('active')
            }
            else{
                i.classList.remove('active')
                for (const child of i.children){
                    child.classList.remove('active')
                }
            }
        })
    }


    static getDataAttributeOnEvent( element ,attribute)
    {
        return element.target.parentElement.parentElement.getAttribute(attribute)
    }

    static object(item)
    {
        return {id :item.id ,node_type :item.node_type ,data:item }
    }

    static containClicked(data)
    {
        return this.some( this.#clickedItems ,data ) || this.selectedItems(data) ? 'clicked active' : ''
    }

    static containOpened(data)
    {
        return this.some( this.#openedItems ,data ) || this.selectedItems(data) ? 'opened active' : ''
    }

    static find( items ,target )
    {
        return Array.isArray(items) && items.find( node => Number( node.id ) === Number( target.id ) && node.node_type === target.node_type )
    }

    static filter( items ,node_type ,id )
    {
        return Array.isArray(items) && items.filter( node => node.node_type !== node_type || node.id !== Number(id) )
    }

    static some(items ,target)
    {
        return Array.isArray(items) && items.some( node => Number( node.id ) === Number( target.id ) && node.node_type === target.node_type )
    }

    static selectedItems(target)
    {
        return this.selected && this.some(this.selected ,target)
    }


}

if (!window.SarinTreeView) {
    window.SarinTreeView = SarinTreeView
}

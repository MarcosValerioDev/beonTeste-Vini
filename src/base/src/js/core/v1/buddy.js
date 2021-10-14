'use strict';

export default function buddy(engine) {
    this.engine = engine;

    this.defaultPlacement = {
        selector: 'body',
        method: 'append'
    };

    this.defaultMethods = {
        interaction: this.interaction.bind(this)
    };

    this.assets = {
        showcasejs: {
            type: 'js',
            src: '/assets/js/showcase.js',
            loaded: false
        },
        bannerjs: {
            type: 'js',
            src: '/assets/js/banner.js',
            loaded: false
        },
        popupjs: {
            type: 'js',
            src: '/assets/js/popup.js',
            loaded: false
        },
        customjs: {
            type: 'js',
            src: '/assets/js/custom.js',
            loaded: false
        },
        beoncss: {
            type: 'css',
            src: '/assets/css/beon.css',
            loaded: false
        }
    };

    this.injectionRetryCount = 200;
    this.injectionRetryDelay = 500; // milliseconds

    this.init();

    return this;
};

buddy.prototype.init = function() {
    this.engine.registerMethods(this.defaultMethods);
    document.addEventListener('beon.engine.create.after', this.initAssets.bind(this));
    this.initInjectionEvents();

    return this;
};

buddy.prototype.initAssets = function() {
    var base = this.engine.getAssetsBase();
    console.log(base)

    for (var i in this.assets) {
        var asset = this.assets[i];

        if (asset.loaded)
            continue;

        switch(asset.type) {
            case 'js':
                this.buildScript(i, base + asset.src);
                break;

            case 'css':
                this.buildStylesheet(i, base + asset.src);
                break;
        }

        asset.loaded = true;
    }

    return this;
};

buddy.prototype.initInjectionEvents = function() {
    document.addEventListener('beon.buddy.inject.fail', function(event) {
        var interaction = event.detail.interaction;
        var placement = event.detail.placement;

        interaction.inject_count = interaction.inject_count || 1;
        interaction.inject_count++;

        if (interaction.inject_count > this.injectionRetryCount) {
            console.log('injection count exceeded limit', interaction.id);

        } else {
            window.setTimeout(function(){
                this.inject(interaction, placement)
            }.bind(this), this.injectionRetryDelay);
        }
    }.bind(this));
};

buddy.prototype.buildStylesheet = function(name, href) {
    var element = document.createElement('link');
        element.rel = 'stylesheet';
        element.type = 'text/css';
        element.href = href;
        element.id = 'beon-style-'+name;

    document.querySelector('head').appendChild(element);

    return element;
};

buddy.prototype.buildScript = function(name, src) {
    var element = document.createElement('script');
        element.type = 'text/javascript';
        element.src = src;
        element.id = 'beon-script-'+name;

    document.querySelector('head').appendChild(element);

    return element;
};

buddy.prototype.interaction = function() {
    var transport = this.engine.transport();
    var args = Array.prototype.slice.call(arguments);
    var url = null;

    var type = args.shift();
    var id = args.shift();
    var params = args.shift();
    var defaultPlacement = args.shift();

    if (
        typeof type == 'undefined' ||
        typeof id == 'undefined'
    ) {
        console.warn('invalid params at interaction call');
        return;
    }

    // before interactions call, init assets
    this.initAssets();

    url = ['interaction', type, id].join('/');

    if (typeof defaultPlacement == 'string') {
        defaultPlacement = {
            selector: defaultPlacement,
            method: 'after'
        };
    } else if (typeof defaultPlacement != 'object') {
        defaultPlacement = this.defaultPlacement;
    }

    transport.get(url, params,
        function(err, xhr, res) {
            if (err)
                return console.warn('beon interaction fault: ' + err);

            var json = JSON.parse(res);

            if (typeof json !== 'object' || json == null) {
                return console.warn('beon responded with invalid json');
            }

            return this.handleInteractionsJson(json, defaultPlacement);
        }.bind(this));
}

buddy.prototype.handleInteractionsJson = function(json, defaultPlacement) {
    this.engine.dispatchHook('interaction.handle.json.before', json);
    this.engine.dispatchEvent('interaction.handle.json.before', json);

    if (! json.interactions.length) {
        return console.warn('beon received empty set of interactions.');
    }

    json.interactions.sort(function(a, b) {
        return b.placement.order - a.placement.order;
    });

    this.engine.dispatchHook('interaction.handle.json.after', json);

    for (var i in json.interactions) {
        var interaction = json.interactions[i];
        var placement = interaction.placement || defaultPlacement;

        this.engine.registerInteraction(interaction);
        this.inject(interaction, placement);
    }

    this.engine.dispatchHook('interaction.handle.end', json);
}

buddy.prototype.inject = function(interaction, placement) {
    var placeholder, anchor;

    if (
        typeof interaction.id == 'undefined' ||
        typeof interaction.type == 'undefined' ||
        typeof interaction.contents == 'undefined'
    ) {
        console.warn('invalid interaction received', interaction);
        return;
    }

    this.engine.dispatchHook('interaction.inject.before', interaction, placement);

    if (placement == null || ! placement || typeof placement == 'undefined') {
        placement = this.defaultPlacement;
    }

    placeholder = document.createElement('div');
    placeholder.setAttribute('id', 'beon-'+interaction.id);
    placeholder.setAttribute('data-type', interaction.type);
    placeholder.setAttribute('class', 'beon-container');
    placeholder.innerHTML = interaction.contents;

    anchor = document.querySelector(placement.selector);

    if (null == anchor) {
        this.engine.dispatchHook('interaction.inject.placement.fail', interaction, placement);
        this.engine.dispatchEvent(
            'buddy.inject.fail',
            {
                reason: 'placement not found',
                interaction: interaction,
                placement: placement
            }
        );

        // console.log('insertion point not found at '+placement.selector);
        return false;
    }

    // remove placement content before other appends
    if (
        (placement.method == 'append' || placement.method == 'prepend')
        && placement.removeContent
    ) {
        anchor.innerHTML = "";
        placement.method = "append";
    }

    if (anchor != null) {
        switch (placement.method) {
            case 'append':
                anchor.append(placeholder);
                break;
            case 'prepend':
                anchor.insertBefore(placeholder, anchor.firstChild);
                break;

            case 'before':
                anchor.parentNode.insertBefore(placeholder, anchor);
                break;
            case 'after':
                anchor.parentNode.insertBefore(placeholder, anchor.nextSibling);
                break;
            default:
                console.log('invalid insertion method');
        }
    }

    // remove placement reference
    if (
        (placement.method == 'before' || placement.method == 'after')
        && placement.removeReference
    ) {
        anchor.parentNode.removeChild(anchor);
    }

    // events handler
    placeholder.addEventListener('click', this.handleInteraction.bind(this));

    // dispatch
    var eventPayload = {
        element: placeholder,
        container: placeholder,
        interaction: interaction
    };

    this.engine.dispatchHook('interaction.inject.after', interaction, placement, placeholder);

    this.engine.dispatchEvent('buddy.inject.after', eventPayload);
    this.engine.dispatchEvent('buddy.inject.after.'+interaction.type, eventPayload);
};

buddy.prototype.handleInteraction = function(event) {
    var target = event.target;
    var anchor = null;
    var interactionRoot = null;
    var interactionContainer = null;
    var interactionItem = null;
    var interaction = {};
    var interactionRegistry;
    var dom = new this.dom();

    // notify beon about an interaction activation
    if (target.nodeName.toUpperCase() != 'A') {
        anchor = dom.parent(target, '.beon-interaction__item a') || null;

    } else {
        anchor = target;
    }

    if (anchor != null) {
        if (! dom.hasClass(anchor, 'beon-interaction__item')) {
            interactionItem = dom.parent(anchor, '.beon-interaction__item');
        } else {
            interactionItem = anchor;
        }

        interactionRoot = dom.parent(interactionItem, '.beon-interaction');
        interactionContainer = interactionRoot.parentNode;

        // source props
        interaction.id      = interactionRoot.getAttribute('id');
        interaction.root    = interactionRoot;
        interaction.item    = interactionItem;
        interaction.target  = anchor;

        // product props
        interaction.hit     = target.getAttribute('class');
        interaction.type    = interactionContainer.getAttribute('data-type');
        interaction.sku     = interactionItem.getAttribute('data-product-sku');
        interaction.product_id = interactionItem.getAttribute('data-product-id');
        interaction.timestamp = Date.now();

        if (anchor.hasAttribute('data-action')) {
            interaction.action = anchor.getAttribute('data-action');
        }

        if (/event-category/.test(anchor.getAttribute('href'))) {
            this.dispatchGAEvent(anchor);
        }

        this.dispatchActionHooks(interaction, event);

        return beon('send', 'event', 'interaction', interaction);
    }
};

buddy.prototype.dispatchGAEvent = function(anchor) {
    var dataLayer, event;

    var part = function(part, href) {
        var parts = new RegExp(part + '=(.+?)(&|$)', 'i').exec(href);

        if (parts) {
            return parts[1];
        }

        return null;
    };

    event = {event: "GAEvent"};

    event.eventCategory = part('event-category', anchor.getAttribute('href'));
    event.eventAction = part('event-action', anchor.getAttribute('href'));
    event.eventLabel = part('event-label', anchor.getAttribute('href'));

    dataLayer = window.dataLayer || [];
    dataLayer.push(event);

    return;
};

buddy.prototype.dispatchActionHooks = function(interaction, event) {
    var interactionRegistry = this.engine.getInteractionFromRegistry(interaction.id);

    if (! interactionRegistry) {
        throw new Error('Given interaction do not have an registry');
    }

    switch (interaction.action) {
        case 'buy':
            this.engine.dispatchEvent('interaction.handle.buy', {interaction: interaction, origin: event});
            this.engine.dispatchHook('interaction.handle.buy', interactionRegistry, interaction, event);
            break;

        case 'details':
            this.engine.dispatchEvent('interaction.handle.details', {interaction: interaction, origin: event});
            this.engine.dispatchHook('interaction.handle.details', interactionRegistry, interaction, event);
            break;
    }
}

// DOM utils
buddy.prototype.dom = function() { return this; };

buddy.prototype.dom.prototype.collectionHas = function(a, b) {
    for(var i = 0, len = a.length; i < len; i ++) {
        if(a[i] == b) return true;
    }
    return false;
};

buddy.prototype.dom.prototype.parent = function(el, parentSelector) {
    var all = document.querySelectorAll(parentSelector);
    var cur = el.parentNode;

    while(cur && ! this.collectionHas(all, cur)) {
        cur = cur.parentNode;
    }

    return cur;
};

buddy.prototype.dom.prototype.hasClass = function(el, classname) {
    var classes = el.getAttribute('class');
    var classesCollection = classes != null ? classes.split(' ') : [];
    return this.collectionHas(classesCollection, classname);
};

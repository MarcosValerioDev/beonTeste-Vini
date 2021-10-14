'use strict';

export default function Chat(parent, root) {
    this.data = {};
    this.parent = parent;
    this.root = jQuery(root);

    this.webchat = null;

    this.config = {
        webchatAppUrl: 'https://apps.mypurecloud.com/webchat',
        webchatServiceUrl: 'https://realtime.mypurecloud.com:443',
        orgId: 10790,
        orgName: 'flexcontactcenter',
        queueName: '[FLEX] - Fila xLab.Work Eventos',
        locale: 'pt-br',
        priority: 0,
        logLevel: 'DEBUG',

        welcomeMessage: 'Olá, seja bem-vindo. Deixe sua mensagem que em alguns instantes você será atendido.',
        showSubmitButton: true,
        companyLogoSmall: {
            width: 149,
            height: 149,
            url: 'http://prototype.xlab.digital/company-logo.png'
        },
        agentAvatar: {
            width: 462,
            height: 462,
            url: 'http://prototype.xlab.digital/agent-logo.png'
        },
        css: {
            width: '100%',
            height: '100%',
            border: '0'
        },
        cssClass: 'webchat-frame',
    };

    return this.init();
};

Chat.prototype.init = function() {
    var me = this;

    this.parent.feedback(null);

    // append chat api scripts
    this.appendScripts();

    // view form
    this.view('form');

    // init chat components
    window.PURECLOUD_WEBCHAT_FRAME_CONFIG = {
        containerEl: 'chat-container'
    };
    
    this.root.find('#chat-submit').on('click', function(event) {
        event.preventDefault();
        event.stopPropagation();

        me.submit();
    });

    this.root.on('method:toggle', function(event, method) {
        if (method == '#popup-chat') {
            me.reset();
        }
    });

    return this;
};

Chat.prototype.appendScripts = function() {
    var me = this,
        script;

    script = jQuery('<script>')
        .attr('type', 'text/javascript')
        .attr('id', 'webchat-api')
        .attr('src', 'https://apps.mypurecloud.com/webchat/jsapi-v1.js');

    jQuery('head').append(script);

    return this;
};

Chat.prototype.reset = function() {
    // destroy chat
    this.root.find('#chat-container').html('');

    // view form
    this.view('form');
    this.root.find('#chat-form input').val('');

    // reset data
    this.data = {};
};

Chat.prototype.submit = function() {
    var me = this;

    if (this.populate())
        if (this.validate()) {
            this.loading('start');

            // beon update
            if (typeof beon !== 'undefined') {
                beon('send', 'event', 'interaction', {
                    type: 'popup',
                    id: 'protoype',
                    action: 'chat'
                });

                beon('send', 'event', 'customer', {
                    type: 'update',
                    payload: this.data
                });
            }
            
            window.setTimeout(function() {
                me.post(
                    function(data) {
                        me.loading('done');
                        me.success(data);
                        me.view('chat');
                    },
                    function(data) {
                        me.loading('done');
                        me.fail('call');

                    }
                );
            }, 1000);

        } else {
            this.fail('data');
        }
};

Chat.prototype.populate = function() {
    var data = {};

    data.id = this.parent.cookie('beon-session-id');;
    data.nome = this.root.find('#chat-nome').val();
    data.email = this.root.find('#chat-email').val();

    this.data = data;

    return data;
};

Chat.prototype.validate = function() {
    if (this.data === {}) {
        return false;
    }

    if (
        ! /^[\w\s]+$/i.test(this.data.nome)
        || ! /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(this.data.email)
    ) {
        console.log('callback data validation fail');
        return false;
    }

    return true;
};

Chat.prototype.post = function(success, fail) {
    var me = this;
    
    try {
        ININ.webchat.create(this.config)
            .then(function (webchat) {
                me.webchat = webchat;

                me.webchat.getConfig().setData({
                    firstName: me.data.nome,
                    customField1Label: 'E-mail',
                    customField1: me.data.email,
                    customField2Label: 'ID de sessão',
                    customField2: me.data.id
                });

                me.webchat.chatEnded = me.chatend.bind(me);

                me.webchat.renderFrame({
                    containerEl: 'chat-container'
                });

                return success();
            })
            .catch(function (err) {
                console.log(err);
                return fail(err);
            });

    } catch (e) {
        return fail(e);
    }
};

Chat.prototype.view = function(id) {
    var popupchat;

    if (id == 'chat') {
        this.root.find('#chat-form').hide();
        this.root.find('#chat-container').fadeIn();
    }

    if (id == 'form') {
        this.root.find('#chat-form').fadeIn();
        this.root.find('#chat-container').hide();
    }

    popupchat = this.root.find('#popup-chat');
    jQuery.each(popupchat.prop('classList'), function(name) {
        if (name != 'view-'+id) {
            popupchat.removeClass(name);
        }
    });

    popupchat.addClass('view-'+id);
};

Chat.prototype.loading = function(state) {
    var button = this.root.find('#chat-submit');

    if (state == 'start') {
        button.attr('disabled', 'disabled');
        button.data('label', button.text());
        button.text('Conectando a um atendente...');
        button.addClass('loading');

    } else {
        button.removeAttr('disabled');
        button.text(button.data('label'));
        button.removeClass('loading');
    }
};

Chat.prototype.chatend = function() {
    var me = this;

    me.root.find('.methods-container').hide();
    me.parent.feedback('chat-end');

    window.setTimeout(function() {
        me.parent.feedback(null);
        me.reset();
    }, 3000)
}

Chat.prototype.fail = function(reason) {
    this.parent.feedback('error-' + reason);
};

Chat.prototype.success = function() {
    var me = this;

    // this.root.find('.methods-container').hide();
    // this.parent.feedback('success');
    this.parent.scroll(this.root);
};
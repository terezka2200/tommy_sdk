define(['util','xhr','app','config','api','addons','tplManager'],
function(util,xhr,app,config,api,addons,TM) {

    var addonCtrl = {
        initLocalAddons: function(page) {
            TM.renderTarget('addonListTemplate', addons.getAddons(), '#addons-local-nav')
            TM.renderTarget('addonViewsListTemplate', addons.getViews(), '#addon-views-local-nav')

            $$('#addons-local-nav').find('a').click(function(ev) {
                var $link = $$(this)
                var package = $link.data('addon')
                var version = $link.data('version')
                var addon = addons.getAddon(package, version)
                app.f7view.router.load({
                    url: this.href,
                    context: addon
                })
                return false
            })

            $$('#addon-views-local-nav').find('a').click(function(ev) {
                var $link = $$(this)
                var url = $link.data('url')
                var package = $link.data('addon')
                var view = $link.data('view')
                addonCtrl.launchAddonView(url, package, view)
                return false
            })

            addonCtrl.loadDefaultAddonView(page)
        },

        // Launch the addon view
        launchAddonView: function(url, package, view) {
            var addon = addons.getAddon(package)

            // Set the currentActorId so API requests come from the right user.
            Template7.global.currentActorId = localStorage.getItem('actorId')

            // The addon needs to be uploaded to the sandbox and installed for
            // the current account in order for many API methods to function.
            // Run the necessary checks and try to install the addon not already
            // installed, then try to run the addon.
            api.getInstalledAddons({ cache: true }).then(function(sandboxAddons) {
                // console.log('sandboxAddons', sandboxAddons)

                // If the addon is installed then load it right away and return.
                for (var x = 0; x < sandboxAddons.length; x++) {
                    if (sandboxAddons[x].package == package) {
                        console.log('loading installed addon', package)
                        app.f7view.router.load({ url: url })
                        return
                    }
                }

                // If the local addon is not installed we need to install it,
                // then load the addon. This is necessary
                console.log('attempting to install local addon on sandbox', package)
                api.installAddon(package, {}, { cache: true, showErrorMessages: false })
                    .then(function(addonInstall) {
                        console.log('installed local addon', addonInstall)
                        app.f7view.router.load({ url: url })
                    })
                    .catch(function() {

                        // If the addon can not be installed then it hasn't been
                        // uploaded yet. Notify the user and take them to the addon
                        // details page so they can upload it.
                        app.f7.alert('Cannot load addon. Please upload it to the sandbox first.', function() {
                            var $link = $$('#addons-local-nav a[data-addon="' + package + '"]')
                            $link.trigger('click')
                        })
                    })
            })
        },

        // Autoload default addon view
        loadDefaultAddonView: function(page) {
            var defaultView = localStorage.getItem('defaultView')
            if (!defaultView || defaultView.indexOf('/') === -1)
                return
            defaultView = defaultView.split('/')
            var addon = defaultView[0]
            var view = defaultView[1]
            if (addon && view) {
                console.log('loading default addon view', addon, view)
                setTimeout(function() {
                    $$('#addon-views-local-nav').find('a[data-addon="' + addon + '"][data-view-id="' + view + '"]').trigger('click') //.click()
                }, 0)
            }
        },

        onViewLoaded: function(addon, view) {
            console.log('addonCtrl', 'onViewLoaded', addon, view)
        },

        onAddonLoaded: function(addon) {
            console.log('addonCtrl', 'onAddonLoaded', addon)
        },

        //
        // Addon Page
        //

        // initAddon: function(page) {
        //     var $page = $$(page.container)
        //     var addon = $page.data('addon')
        //     var view = $page.data('view')
        //     // localStorage.setItem('defaultView', addon)
        //     // localStorage.setItem('defaultView', view)
        // },

        //
        // Addon Details Page
        //

        initAddonDetails: function(page) {
            console.log('addonCtrl', 'initAddonDetails', page)
            var $page = $$(page.container),
                package = page.query.package,
                version = page.query.version

            // Query addon installed status from the sandbox server
            addonCtrl.initAddonDetailsSandbox(package, version)
            // addonCtrl.initAddonDetailsStore(package, version)

            // Sandbox actions
            $page.on('click', 'a[data-command="sandbox-upload"]', function() {
                addonCtrl.uploadSandboxAddon(package, version)
            })

            $page.on('click', 'a[data-command="sandbox-delete"]', function() {
                addonCtrl.deleteSandboxAddon(package, version)
            })

            // Store actions
            // $page.on('click', 'a[data-command="store-submit"]', function() {
            //     addonCtrl.submitStoreAddon(package, version)
            // })
            //
            // $page.on('click', 'a[data-command="store-delete"]', function() {
            //     addonCtrl.deleteStoreAddon(package, version)
            // })
        },

        initAddonDetailsSandbox: function(package, version) {
          return window.tommy.api.getAddonVersion(package, version, { showErrorMessages: false }) // url: SANDBOX_ENDPOINT,
            .then(addonCtrl.renderAddonDetailsSandbox)
            .catch(addonCtrl.renderAddonDetailsSandbox)
        },

        // initAddonDetailsStore: function(package, version, callback) {
        //   T.api.get('/addons/' + package + '/versions/' + version, {}).then(function(err, res) {
        //     addonCtrl.renderAddonDetailsStore(res)
        //     if (callback)
        //       callback(err, res)
        //   })
        // },

        renderAddonDetailsSandbox: function(context) {
          TM.renderTarget('addonDetailsSandboxTemplate', context || {}, '#addon-details-sandbox')
        },

        // renderAddonDetailsStore: function(context) {
        //   TM.renderTarget('addonDetailsStoreTemplate', context || {}, '#addon-details-store')
        // },

        uploadSandboxAddon: function(package, version) {
          console.log('Installing addon', package, version)
          addonCtrl.renderAddonDetailsSandbox({ uploading: true })
          $$.ajax({
            url: '/addon/sandbox/upload/' + package + '/' + version,
            method: 'POST',
            dataType: 'json',
            success: function(data, status, xhr) {
              addonCtrl.renderAddonDetailsSandbox(data)
              app.f7.addNotification({
                  title: 'Addon Uploaded',
                  message: 'Your addon uploaded successfully',
                  hold: 4000
              })
            },
            error: function(xhr, status) {
              app.f7.addNotification({
                  title: 'Addon Upload Failed',
                  message: 'Your addon uploaded failed: ' + xhr.responseText,
                  hold: 4000
              })
            }
          })
        },

        // submitStoreAddon: function(package, version, callback) {
        //   console.log('Submitting addon', package, version)
        //   addonCtrl.renderAddonDetailsStore({ submitting: true })
        //   $$.ajax({
        //     url: '/addon/store/submit/' + package + '/' + version,
        //     method: 'POST',
        //     dataType: 'json',
        //     success: function(data, status, xhr) {
        //       data.submitted = true
        //       addonCtrl.renderAddonDetailsStore(data)
        //       app.f7.addNotification({
        //           title: 'Addon Submitted',
        //           message: 'Your addon was submitted successfully and is prending review.',
        //           hold: 4000
        //       })
        //       if (callback)
        //         callback(null, data)
        //     },
        //     error: function(xhr, status) {
        //       app.f7.addNotification({
        //           title: 'Addon Submittion Failed',
        //           message: 'Your addon submission failed: ' + xhr.responseText,
        //           hold: 4000
        //       })
        //       if (callback)
        //         callback(xhr.responseText, null)
        //     }
        //   })
        // },

        deleteSandboxAddon: function(package, version) {
          console.log('Uninstalling addon version', package, version)
          addonCtrl.renderAddonDetailsSandbox({ status: 'Deleting...', deleting: true })

          return window.tommy.api.deleteAddonVersion(package, version, { url: SANDBOX_ENDPOINT })
            .then(function(res) {
              addonCtrl.renderAddonDetailsSandbox()
              app.f7.addNotification({
                  title: 'Addon Uninstalled',
                  message: 'Addon uninstalled successfully',
                  hold: 4000
              })
            })
            .catch(function(err) {
              app.f7.addNotification({
                  title: 'Addon Error',
                  message: 'Addon uninstall failed: ' + err,
                  hold: 4000
              })
            })
        },

        // deleteStoreAddon: function(package, version, callback) {
        //   console.log('Deleting store addon version', package, version)
        //   addonCtrl.renderAddonDetailsStore({ status: 'Deleting...', deleting: true })
        //   T.api.delete('/addons/' + package + '/versions/' + version, {}).then(function(err, res) {
        //     addonCtrl.renderAddonDetailsStore()
        //     if (err) {
        //       app.f7.addNotification({
        //           title: 'Addon Deleted',
        //           message: 'Addon delete failed: ' + err,
        //           hold: 4000
        //       })
        //     }
        //     else {
        //       app.f7.addNotification({
        //           title: 'Addon Deleted',
        //           message: 'Addon deleted successfully',
        //           hold: 4000
        //       })
        //     }
        //     if (callback)
        //       callback(err, res)
        //   })
        // }
    }

    return addonCtrl
})

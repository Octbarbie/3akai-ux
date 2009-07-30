/*
 * Licensed to the Sakai Foundation (SF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The SF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

/*global $, Config, sdata, Querystring */

var sakai = sakai || {};
sakai.site_basic_settings = function() {

    //////////////////////
    // Config variables //
    //////////////////////
    
    var siteid = ""; //The siteid for the site we are editing.
    var siteinfo = {}; // The json object with all the info for this site.
    var editloc = false;
        
    ///////////
    // ACL's //
    ///////////
    
    // These are the different Access Control Lists for each status of a site.
    var aclOffline = [
                "k:*,s:OW,g:1,p:1",
                "k:*,s:AU,g:0,p:1",
                "k:*,s:AN,g:0,p:1"
            ];
    var aclOnlinePublic = ['foo'];
    var aclOnlineSakaiUsers = [
                "k:*,s:OW,g:1,p:1", 
                "k:*,s:AU,g:1,p:1",
                "k:*,s:AN,g:0,p:1"
            ];
    var aclOnlineInvite = [
                    "k:*,s:OW,g:1,p:1",
                    "k:*,s:GR:Viewer:maintain,g:1,p:1",
                    "k:*,s:GR:Collaborater:maintain,g:1,p:1",
                    "k:*,s:GR:owner:maintain,g:1,p:1",
                    "k:*,s:AU,g:0,p:1",
                    "k:*,s:AN,g:0,p:1"
                ];

    /////////////
    // CSS IDs //
    /////////////
    
    var siteSettings = "#siteSettings";
    var siteSettingsClass = ".siteSettings";
	var siteSettingsName = "siteSettings";
    var siteSettingsAppendSiteIDtoURL = siteSettingsClass + "_appendSiteIDtoURL";
    
    var siteSettingsTitleClass = siteSettingsClass + "_title";
    var siteSettingsConfirm = siteSettings + "_confirm";
    var siteSettingsResponse = siteSettings + "_response";
    var siteSettingsSave = siteSettings + "_save";
    var siteSettingsCancel = siteSettings + "_cancel";
    
    //    Site info
    var siteSettingsInfo = siteSettings + "_info";
    var siteSettingsInfoTitle = siteSettingsInfo + "_title";
    var siteSettingsInfoDescription = siteSettingsInfo + "_description";
    var siteSettingsInfoSakaiDomain = siteSettingsInfo + "_sakaiDomain";
    var siteSettingsInfoSitePart = siteSettingsInfo + "_sitePart";
    var siteSettingsInfoSitePartText = siteSettingsInfoSitePart + "_text";
    var siteSettingsInfoSitePartTextLocation = siteSettingsInfoSitePartText + "_location";
    var siteSettingsInfoSitePartTextEdit = siteSettingsInfoSitePartText + "_edit";
    var siteSettingsInfoSitePartEdit = siteSettingsInfoSitePart + "_edit";
    var siteSettingsInfoSitePartEditInput = siteSettingsInfoSitePartEdit + "_input";
    var siteSettingsInfoSitePartEditInputTooltip = siteSettingsInfoSitePartEditInput + "_tooltip";
    var siteSettingsInfoSitePartEditSave = siteSettingsInfoSitePartEdit + "_save";
    var siteSettingsInfoSitePartEditCancel = siteSettingsInfoSitePartEdit + "_cancel";
    //    Status & access
    var siteSettingsStatus = siteSettings + "_status";
    var siteSettingsStatusOn = siteSettingsStatus + "_on";
    var siteSettingsStatusOff = siteSettingsStatus + "_off";    
    var siteSettingsAccess = siteSettings + "_access";
    var siteSettingsAccessPublic = siteSettingsAccess + "_public";
    var siteSettingsAccessSakaiUsers = siteSettingsAccess + "_sakaiUsers";
    var siteSettingsAccessInvite = siteSettingsAccess + "_invite";
    //    Delete
    var siteSettingsDelete = siteSettings + "_delete";
    var siteSettingsDeleteButton = siteSettingsDelete + "_button";
    var siteSettingsDeleteButtonContainer = siteSettingsDeleteButton + "_container";
    var siteSettingsDeleteContainer = siteSettingsDelete + "_container";
    var siteSettingsDeleteYes = siteSettingsDelete + "_yes";
    var siteSettingsDeleteNo = siteSettingsDelete + "_no";
    
    //    Errors
    var siteSettingsError = siteSettings + "_error";
    var siteSettingsErrorUnauthorized = siteSettingsError + "_unauthorized";
    var siteSettingsErrorSaveFail = siteSettingsError + "_saveFail";
    var siteSettingsErrorSaveSuccess = siteSettingsError + "_saveSuccess";
	
	// Language fields
	var siteSettingLanguageCmb = siteSettings + "_language";
	var siteSettingLanguageTemplate = siteSettingsName + "_languagesTemplate";
    
    
    
    /////////////////////////
    // Retrieval functions //
    /////////////////////////
    
    
    /**
	 * Replace or remove malicious characters from the string
	 * We use this function to modify the siteid
	 * @param {String} input
	 */
	var replaceCharacters = function(input){
		input = input.toLowerCase().replace(/ /g,"-");
		input = input.replace(/[:]|[?]|[=]|[&]/g,"_");
		return input;
	};
    
		/**
	 * Puts the languages in a combobox
	 * @param {Object} languages
	 */
	var putLangsinCmb = function(languages, json){
		$(siteSettingLanguageCmb).html($.Template.render(siteSettingLanguageTemplate, languages));
		if(json.language){
			$(siteSettingLanguageCmb + " option[value=" + json.language + "]").attr("selected", true);
		}
	};
	
	/**
	 * Gets all the languages supported and puts them in a combobox
	 */
	var getLanguages = function(json){
		$.ajax({
			url : "/dev/_configuration/languages.json",
			success : function(data) {
				languages = $.evalJSON(data);	
				putLangsinCmb(languages, json);
			},
			error: function(status){
				alert("Failed to retrieve languages.");
			}
		});
	};
    
    /**
     * This will fill in all the field settings for the site.
     */
    var fillBasicSiteSettings = function(siteid) {
        $.ajax({
            url: "/sites/" + siteid + ".json",
			cache: false,
            success: function(response) {
                var json = $.evalJSON(response);
                siteinfo = json;
                
                // Check if we are an owner for this site.
                // Otherwise we will redirect to the site page.
				var isMaintainer = false;
				for (var i = 0; i < sdata.me.user.subjects.length; i++){
					if (sdata.me.user.subjects[i] === "g-" + siteid + "-collaborators"){
						isMaintainer = true;
						break;
					}
				}
				
                if (isMaintainer) {                
                    // Fill in the info.
                    $(siteSettingsInfoSakaiDomain).text(document.location.protocol + "//" + document.location.host + "/sites");
                    $(siteSettingsInfoDescription).val(json.description);
                    $(siteSettingsInfoTitle).val(json.name);
                    $(siteSettingsTitleClass).text(json.name);
                    $(siteSettingsInfoSitePart).text(Config.URL.SITE_URL_SITEID.replace(/__SITEID__/, ''));
                    $(siteSettingsInfoSitePartTextLocation).text(json.id);
                    getLanguages(json);
					
                    // Status
                    if (json.status && json.status === 'offline') {
                        $(siteSettingsStatusOff).attr('checked', 'checked');
                        //    Hide the other part.
                        $(siteSettingsAccess).hide();
                    }
                    else {
                        $(siteSettingsStatusOn).attr('checked', 'checked');
                    }
                    
                    // Access
                    if (json.access && json.access.toLowerCase() === 'sakaiusers') {
                        $(siteSettingsAccessSakaiUsers).attr('checked', 'checked');
                    }
                    else if (json.access && json.access.toLowerCase() === 'invite') {
                        $(siteSettingsAccessInvite).attr('checked', 'checked');
                    }
                    else {
                        $(siteSettingsAccessPublic).attr('checked', 'checked');
                    }     
                }
                else {
                    // The user is not an owner for this site. we redirect him/her to the site page.
                    //document.location = Config.URL.SITE_URL_SITEID.replace(/__SITEID__/gi, siteid);
                }      
            },
            error: function(status) {
                alert("Failed to get the site info.");
            }
        });
    };
    
    
    /**
     * This will fill in all the info in the various fields over the page
     */
    var fillPage = function() {
        // Start by setting the siteids in the various urls.        
        var qs = new Querystring();
        siteid = qs.get("siteid", false);        
        $(siteSettingsAppendSiteIDtoURL).each(function(i, el) {
            $(el).attr('href',$(el).attr('href') + siteid);
        });
        
        // fill in the title, description, etc for this site.
        fillBasicSiteSettings(siteid);
    };
    
    ////////////////////////
    // Save site settings //
    ////////////////////////
    
    
    var saveSettingsDone = function(success, data) {
        if (success) {
            $(siteSettingsResponse).text($(siteSettingsErrorSaveSuccess).text());
        }
        else {
            //    The user has no sufficient rights.
            if (data === 401) {
                $(siteSettingsResponse).text($(siteSettingsErrorUnauthorized).text());
            }
            //    Show a general error message.
            else {
                $(siteSettingsResponse).text($(siteSettingsErrorSaveFail).text());
            }
        }
		
        // Show the result
        $(siteSettingsConfirm).hide();
        $(siteSettingsResponse).show();
        
        // After x seconds we hide the response and show the buttons again.
        setTimeout(function() { 
            $(siteSettingsResponse).hide();
            $(siteSettingsConfirm).show();
        }, 2500);
    };
    
    
    
    /**
     * This function will check if all the values have been filled in correctly.
     * It will add a class to those that aren't.
     * @return {Boolean} true = OK, false = something was filled in wrong.
     */
    var checkValues = function() {
        var descEL = $(siteSettingsInfoDescription);
        var titleEL = $(siteSettingsInfoTitle);
        var siteLocEL = $(siteSettingsInfoSitePartEditInput);
        var ok = true;
        if (titleEL.val() === '') {
            titleEL.addClass('invalid');
            ok = false;
        }
        /*
		if (descEL.val() === '') {
		            descEL.addClass('invalid');
		            ok = false;
		        }
		*/
        if (editloc && replaceCharacters(siteLocEL.val()) === '') {
            siteLocEL.addClass('invalid');
            ok = false;
        }
        return ok;
    };
    
    /**
     * This will set the permissions for this site.
     * @param {String} location The JCR location for this site.
     * @param {String} status The status for this site. (online or offline)
     * @param {String} access Who gets access to the site (public, sakaiUsers, invite)
     */
    var setStatusForSite = function(location, status, access) {
		// Get the correct ACL for this site
		alert(access);
		var acl = "";
		if (status === "offline") {
			// Only the owner gets access.
			acl = "offline";
		} else {
			if (access === 'everyone') {
				acl = "everyone";
			} else if (access.toLowerCase() === 'sakaiusers') {
				acl = "sakaiusers";
			} else if (access === 'invite') {
				acl = "invite";
			}
		}
        
		var viewers = "g-" + siteid + "-viewers";
		var registered = "registered";
		var everyone = "everyone";
		
		var actions = [];
		
	        if (acl == "offline"){
			actions.push([viewers, "denied"]);
			actions.push([everyone, "denied"]);
			//setACL(viewers, "denied");
			//setACL(registered, "denied");
			//setACL(everyone, "denied");
		} else if (acl === "everyone"){
			actions.push([viewers, "granted"]);
			actions.push([everyone, "granted"]);
			//setACL(viewers, "granted");
			//setACL(registered, "granted");
			//setACL(everyone, "granted");
		} else if (acl === "sakaiusers"){
			actions.push([viewers, "granted"]);
			actions.push([everyone, "denied"]);
			//setACL(viewers, "granted");
			//setACL(registered, "granted");
			//setACL(everyone, "denied");
		} else if (acl === "invite"){
			actions.push([viewers, "granted"]);
			actions.push([everyone, "denied"]);
			//setACL(viewers, "granted");
			//setACL(registered, "denied");
			//setACL(everyone, "denied");
		}

		setACL(actions);
		saveSettingsDone(true);

	};
	
	var setACL = function(actions){
		if (actions.length > 0){
			var group = actions[0][0];
			var toSet = actions[0][1];
			$.ajax({
				url: "/sites/" + siteid + ".modifyAce.json",
				type: "POST",
				success: function(data){
					actions.splice(0,1);
					setACL(actions);
				},
				error: function(status){
					actions.splice(0,1);
					setACL(actions);
				},
				data: {
					"principalId":group,
					"privilege@jcr:read":toSet
				}
			});
		}
	};
    
    /**
     * This will do a request to the site service to update this site its basic settings.
     * If this succeeds it will do a request too the JCR PERMISSIONS function to set all the permissions
     * correctly.
     */
    var saveSettings = function() {
        // Check if everything is filled in correctly.
        if (checkValues()) {
            // we update the info.
            // values
            var descEL = $(siteSettingsInfoDescription);
            var titleEL = $(siteSettingsInfoTitle);
            var siteLocEL = $(siteSettingsInfoSitePartEditInput);
            
            var loc = siteinfo.location;
            // If the user edited the location we have to be sure that it is a valid one.
            if (editloc) {
                loc = replaceCharacters(siteLocEL.val());
                //    Make sure there is a /
                if (loc.substr(0, 1) !== '/') {
                    loc = '/' + loc;
                }
            }
            // Get the status and access options.
            var status = ($(siteSettingsStatusOn + "[type=radio]").is(":checked")) ? "online" : "offline";
            var access = "everyone";
            if ($(siteSettingsAccessSakaiUsers + "[type=radio]").is(":checked")) {
                access = "sakaiUsers";
            }
            else if ($(siteSettingsAccessInvite + "[type=radio]").is(":checked")) {
                access = "invite";
            }
            
            var language = $(siteSettingLanguageCmb + " option:selected").val();
            var tosend = {
                'name' : titleEL.val(),
                'description' : descEL.val(),
                'status' : status,
                'access' : access,
				'language' : language
            };
                        
            //	Do a patch request to the profile info so that it gets updated with the new information.
            $.ajax({
                url: "/sites/" + siteinfo.id,
                type: "POST",
                data: tosend,
                success: function(data) {
                    // If we changed the location for this site, we have to move the folder.
                    setStatusForSite(loc, status, access);
                },
                error: function(data) {
                    saveSettingsDone(false, data);
                }
            });
        }
    };
    
    ////////////
    // Delete //
    ////////////
    
    /**
     * This will delete the site.
     * There are a couple of things we have to do before we delete the site.
     *  - Get all the members for this site
     *  - Remove them from it, so they dont see a link in there my_sakai panel.
     *  - Remove the site out of JCR.
     */
    var deleteThisSite = function() {
       	$.ajax({
       		type: "DELETE",
            url: "/sites/" + siteid,
            success: function(data) {
				
				// Delete viewer group
				$.ajax({
		       		type: "POST",
		            url: "/system/userManager/group/g-" + siteid + "-viewers.delete.html",
		            success: function(data) {
						
						// Delete collaborator group
						$.ajax({
				       		type: "POST",
				            url: "/system/userManager/group/g-" + siteid + "-collaborators.delete.html",
				            success: function(data) {
								
				                alert("Your site has been successfully deleted");
								document.location = Config.URL.MY_DASHBOARD;
								
				            },
				            error: function(data) {
				            	alert("Failed to delete collaborators.");                        
				            }
				       	});
						
		            },
		            error: function(data) {
		            	alert("Failed to delete viewers.");                        
		            }
		       	});				
							
            },
            error: function(data) {
            	alert("Failed to delete site.");                        
            }
       	});
       
    };
    
    
    /////////////////////
    // Event listeners //
    /////////////////////
    
    // Site location
    
    /**
     * The user wants to edit the location for a site.
     * We will swap the text with an input box.
     */
    $(siteSettingsInfoSitePartTextEdit).bind('click', function() {
        editloc = true;
        $(siteSettingsInfoSitePartEditInput).val(siteinfo.location);
        $(siteSettingsInfoSitePartText).hide();
        $(siteSettingsInfoSitePartEdit).css('display', 'inline');
    });
    /** The user cancelled the editing part of the location. */
    $(siteSettingsInfoSitePartEditCancel).bind('click', function() {
        editloc = false;
        $(siteSettingsInfoSitePartEdit).hide();
        $(siteSettingsInfoSitePartText).css('display', 'inline');
    });
    
    
    /*
     * Edit location 
     */
    $(siteSettingsInfoSitePartEditInput).focus(function() {
        var offset = $(siteSettingsInfoSitePartEditInput).offset();
        $(siteSettingsInfoSitePartEditInputTooltip).css('position', 'absolute');
        $(siteSettingsInfoSitePartEditInputTooltip).css('left', offset.left);
        $(siteSettingsInfoSitePartEditInputTooltip).css('top', offset.top + 30);
        
        $(siteSettingsInfoSitePartEditInputTooltip).fadeIn("normal");
    });
    
    $(siteSettingsInfoSitePartEditInput).blur(function() {
        // Hide the tooltip
        $(siteSettingsInfoSitePartEditInputTooltip).hide();
        // Replace all the bad chars.
        $(siteSettingsInfoSitePartEditInput).val(replaceCharacters($(siteSettingsInfoSitePartEditInput).val()));
    });
    
    /* 
     * The user wants the site offline, disable the other options 
     */
    $(siteSettingsStatusOff).bind('click', function() {
        $(siteSettingsAccess).hide();
    });
    $(siteSettingsStatusOn).bind('click', function() {
        $(siteSettingsAccess).show();
    });
    
    /*
     * Save all the settings
     */
    $(siteSettingsSave).bind('click', function() {
        saveSettings();
    });
    
    /*
     * Delete this site
     */
    $(siteSettingsDeleteButton).bind('click', function() {
        // Show the overlay.
        $(siteSettingsDeleteContainer).jqmShow();
    });
    $(siteSettingsDeleteContainer).jqm({
		modal: true,
		overlay: 20,
		toTop: true
	});
    $(siteSettingsDeleteYes).bind('click', function() {
        deleteThisSite();
    });
    $(siteSettingsDeleteNo).bind('click', function() {        
        $(siteSettingsDeleteContainer).jqmHide();
    });
    
    fillPage();
};
sdata.container.registerForLoad("sakai.site_basic_settings");

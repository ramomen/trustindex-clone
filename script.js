"use strict";
Element.prototype.isNodeList = function() {
    return false
};
NodeList.prototype.isNodeList = HTMLCollection.prototype.isNodeList = function() {
    return true
};
if (Trustindex === undefined) {
    var Trustindex = function() {
        return {
            loaded_css: [],
            loaded_rich_snippet: false,
            resizerTimeoutPointer: null,
            CDNUrl: "https://cdn.trustindex.io/",
            getDefaultAvatarUrl: function() {
                return Trustindex.CDNUrl + "assets/default-avatar/noprofile-01.svg"
                console.log(CDNUrl);
            },
            getWidgetUrl: function(b) {
                if (typeof b == "undefined") {
                    return false
                }
                return Trustindex.CDNUrl + "widgets/" + b.substring(0, 2) + "/" + b + "/"
            },
            init: function() {
                let scripts = document.querySelectorAll("div[src*='.trustindex.io'],script[src*='.trustindex.io']");
                for (let i = 0; i < scripts.length; i++) {
                    if (scripts[i].getAttribute("src").search("loader") == -1) {
                        continue
                    }
                    let script_tag = scripts[i];
                    let key = scripts[i].getAttribute("src").split("?");
                    if (key.length < 2) {
                        continue
                    }
                    key = key[key.length - 1];
                    key = key.split("&")[0];
                    if (!key || key.search("=") != -1) {
                        continue
                    }
                    if (script_tag.getAttribute("data-ti-loaded")) {
                        continue
                    }
                    script_tag.insertAdjacentHTML("afterend", "<div>loading...</div>");
                    script_tag.setAttribute("data-ti-loaded", true);
                    let http = new XMLHttpRequest();
                    http.open("GET", Trustindex.getWidgetUrl(key) + "content.html");
                    http.send();
                    http.onload = function() {
                        if (http.readyState == 4 && http.status == 200) {
                            let html = http.responseText;
                            script_tag.nextSibling.remove();
                            script_tag.insertAdjacentHTML("afterend", html);
                            let widget = script_tag.nextSibling;
                            Trustindex.init_widget(widget);
                            if (widget.getAttribute("style") && widget.getAttribute("style").indexOf("border: 4px dashed red") != -1) {
                                return
                            }
                            widget.style.display = "none";
                            if (!widget.layout_id) {
                                script_tag.nextSibling.innerHTML = "Layout id not found!";
                                return
                            }
                            if (!widget.container) {
                                script_tag.nextSibling.innerHTML = "Container id not found!";
                                return
                            }
                            let css_url = null;
                            if (widget.set_id) {
                                css_url = Trustindex.CDNUrl + "assets/widget-presetted-css/" + widget.layout_id + "-" + widget.set_id + ".css"
                            } else {
                                if (!widget.pid) {
                                    css_url = Trustindex.CDNUrl + "widget-assets/css/" + widget.layout_id + "-" + (widget.classList.contains("ti-dark") ? "blue-dark" : "blue") + ".css"
                                }
                            }
                            if (css_url && Trustindex.loaded_css.indexOf(css_url) == -1) {
                                Trustindex.addCSS(css_url, function() {
                                    widget.style.display = "";
                                    Trustindex.resize_widget(widget);
                                    Trustindex.init_pager(widget)
                                });
                                Trustindex.loaded_css.push(css_url)
                            } else {
                                widget.style.display = "";
                                Trustindex.resize_widget(widget);
                                Trustindex.init_pager(widget)
                            }
                            Trustindex.formatReviews();
                            Trustindex.replaceErrorImages()
                        } else {
                            script_tag.nextSibling.innerHTML = "Widget not found!"
                        }
                    }
                }
                Trustindex.formatReviews();
                Trustindex.replaceErrorImages();
                Trustindex.resize_widgets();
                window.addEventListener("resize", function() {
                    clearTimeout(Trustindex.resizerTimeoutPointer);
                    Trustindex.resizerTimeoutPointer = setTimeout(function() {
                        Trustindex.resize_widgets()
                    }, 1000)
                });
                window.addEventListener("load", function() {
                    Trustindex.removePopupEvents();
                    setTimeout(function() {
                        Trustindex.resize_widgets()
                    }, 40)
                });
                window.addEventListener("scroll", Trustindex.removePopupEvents);
                setTimeout(Trustindex.removePopupEvents, 2500)
            },
            init_widget: function(b) {
                b.layout_id = b.getAttribute("data-layout-id");
                b.set_id = b.getAttribute("data-set-id");
                b.pid = b.getAttribute("data-pid");
                if (b.layout_id) {
                    b.layout_id = parseInt(b.layout_id)
                }
                b.container = b.querySelector(".ti-widget-container");
                b.reviews_container = b.querySelector(".ti-reviews-container");
                b.reviews_container_wrapper = b.querySelector(".ti-reviews-container-wrapper");
                b.pager_autoplay_timeout = b.getAttribute("data-pager-autoplay-timeout");
                b.mouse_over = false
            },
            init_dots: function(b) {
                let dot_container = b.querySelector(".ti-controls-dots");
                if (dot_container) {
                    let html = "";
                    let length = 1 + b.querySelectorAll(".ti-review-item").length - Trustindex.getVisibleReviewNum(b);
                    for (let di = 0; di < length; di++) {
                        html += '<div class="dot" data-pager-state="' + di + '"></div> '
                    }
                    dot_container.innerHTML = html;
                    let el = dot_container.querySelector('.dot[data-pager-state="' + (b.pager_state || 0) + '"]');
                    if (el) {
                        el.classList.add("active")
                    }
                }
            },
            init_pager: function(b) {
                if (window.jQuery && b instanceof jQuery) {
                    b.each(function() {
                        Trustindex.init_pager(this)
                    });
                    return
                }
                if (b.isNodeList !== undefined && b.isNodeList()) {
                    b.forEach(function(c) {
                        Trustindex.init_pager(c)
                    });
                    return
                }
                if (b.layout_id === undefined) {
                    Trustindex.init_widget(b)
                }
                Trustindex.init_dots(b);
                Trustindex.setClickableParts(b);
                Trustindex.setReadMore(b);
                Trustindex.handleSubContents(b);
                if (b.pager_autoplay_timeout !== null) {
                    b.pager_state = 0;
                    b.pager_moving = false;
                    b.pager_autoplay_direction = "next";
                    b.pager_position = "0px";
                    b.pager_autoplay_timeout = parseInt(b.pager_autoplay_timeout);
                    Trustindex.controlsShowHide(b);
                    b.querySelectorAll(".ti-review-item").forEach(function(c) {
                        c.style.position = "relative"
                    });
                    b.querySelector(".ti-widget-container").addEventListener("mouseenter", function(c) {
                        b.mouse_over = true
                    });
                    b.querySelector(".ti-widget-container").addEventListener("mouseleave", function(c) {
                        b.mouse_over = false
                    });
                    b.addEventListener("click", function(c) {
                        if (c.target.matches(".ti-controls .ti-next") || c.target.matches(".ti-controls .ti-prev")) {
                            c.preventDefault();
                            Trustindex.moverBtnClicked(b, c.target.classList.contains("ti-next"), "manual", 500)
                        }
                        if (c.target.matches(".ti-controls-dots .dot")) {
                            c.preventDefault();
                            Trustindex.moveReviews(b, parseInt(c.target.getAttribute("data-pager-state")), "manual", 500)
                        }
                    }, false);
                    Trustindex.setAutoplay(b);
                    let touchstartx, touchmovex, touchstartY, touchmoveY, isUpDownScroll;
                    b.querySelector(".ti-reviews-container").addEventListener("touchstart", function(c) {
                        touchstartx = c.touches[0].pageX;
                        touchstartY = c.touches[0].pageY;
                        touchmovex = null;
                        touchmoveY = null;
                        b.mouse_over = true
                    }, {
                        passive: true
                    });
                    b.querySelector(".ti-reviews-container").addEventListener("touchmove", function(c) {
                        touchmovex = c.touches[0].pageX;
                        touchmoveY = c.touches[0].pageY;
                        let xmove = Math.abs(touchstartx - touchmovex);
                        let ymove = Math.abs(touchstartY - touchmoveY);
                        if (xmove > 10 || xmove > ymove) {}
                    }, {
                        passive: true
                    });
                    b.querySelector(".ti-reviews-container").addEventListener("touchend", function(c) {
                        if (touchstartx && touchmovex && Math.abs(touchstartx - touchmovex) > 60) {
                            let direction = touchstartx > touchmovex;
                            b.querySelectorAll(".ti-review-content").forEach(function(d) {
                                d.scrollTop = 0
                            });
                            Trustindex.moverBtnClicked(b, direction, "manual", 500)
                        }
                        touchstartx = null;
                        touchmovex = null;
                        b.mouse_over = false
                    }, {
                        passive: true
                    })
                }
                if (location.hostname != "admin.trustindex.io") {
                    b.addEventListener("click", function(c) {
                        if (c.target.matches(".disable-widget")) {
                            c.preventDefault();
                            document.querySelectorAll(".ti-widget").forEach(function(d) {
                                d.classList.add("ti-disabled")
                            });
                            Trustindex.setCookie("ti-widget-disabled", 1, 10, "/", location.hostname);
                            if (!b.querySelector(".ti-enable-widget")) {
                                b.remove()
                            }
                        } else {
                            if (c.target.matches(".ti-enable-widget")) {
                                c.preventDefault();
                                document.querySelectorAll(".ti-widget").forEach(function(d) {
                                    d.classList.remove("ti-disabled")
                                });
                                Trustindex.removeCookie("ti-widget-disabled", "/", location.hostname)
                            }
                        }
                    });
                    if (Trustindex.getCookie("ti-widget-disabled")) {
                        document.querySelectorAll(".ti-widget").forEach(function(c) {
                            c.classList.add("ti-disabled")
                        })
                    }
                }
                b.removeEventListener("click", Trustindex.popupHandler);
                b.addEventListener("click", Trustindex.popupHandler);
                b.removeEventListener("click", Trustindex.popupCloseHandler);
                b.addEventListener("click", Trustindex.popupCloseHandler)
            },
            removePopupEvents: function() {
                document.querySelectorAll('.ti-widget a[href="#popup"], .ti-widget a[href="#dropdown"]').forEach(function(b) {
                    let clone = b.cloneNode(true);
                    b.parentNode.replaceChild(clone, b);
                    let widget = clone.closest(".ti-widget");
                    Trustindex.handleSubContents(widget)
                });
                window.removeEventListener("scroll", Trustindex.removePopupEvents)
            },
            setAutoplay: function(c, b) {
                if (b !== undefined) {
                    c.pager_autoplay_timeout = b
                }
                if (c.intervalPointer !== undefined) {
                    clearInterval(c.intervalPointer)
                }
                if (c.pager_autoplay_timeout > 0) {
                    c.intervalPointer = setInterval(function() {
                        Trustindex.moverBtnClicked(c, c.pager_autoplay_direction == "next", "auto")
                    }, c.pager_autoplay_timeout * 1000)
                }
            },
            moverBtnClicked: function(d, e, b, c) {
                if (b == "manual") {
                    if ((e && !d.isNext) || (!e && !d.isPrev)) {
                        Trustindex.noReviewsAnimation(d, e);
                        return false
                    }
                }
                if (d.pager_moving || (d.mouse_over && b == "auto")) {
                    return false
                } else {
                    let num_reviews = d.querySelectorAll(".ti-review-item").length;
                    let num_visible_reviews = Trustindex.getVisibleReviewNum(d);
                    if (num_reviews <= num_visible_reviews) {
                        return false
                    }
                }
                let direction = e ? 1 : -1;
                Trustindex.moveReviews(d, d.pager_state + direction, b, c)
            },
            moveReviews: function(e, d, b, c) {
                e.pager_state = d;
                e.pager_moving = true;
                Trustindex.controlsShowHide(e);
                Trustindex.slideReviews(e, c);
                if (b != "auto" && e.intervalPointer !== undefined) {
                    clearInterval(e.intervalPointer);
                    delete e.intervalPointer
                }
            },
            slideReviews: function(c, b) {
                if (c.pager_position === undefined) {
                    return
                }
                if (b === undefined) {
                    b = 1000
                }
                let num_visible_reviews = Trustindex.getVisibleReviewNum(c);
                let rotate_left = (-1 * c.pager_state * c.reviews_container_wrapper.offsetWidth / num_visible_reviews) + "px";
                Trustindex.animateReviews(c, c.pager_position, rotate_left, b);
                c.pager_position = rotate_left;
                setTimeout(function() {
                    c.pager_moving = false
                }, b)
            },
            noReviewsAnimation: function(b, c) {
                b.pager_moving = true;
                let start = parseInt(b.pager_position);
                let multiply = c ? -1 : 1;
                let animates = [{
                    pos: 50,
                    speed: 160
                }, {
                    pos: -70,
                    speed: 100
                }, {
                    pos: 40,
                    speed: 80
                }, {
                    pos: -20,
                    speed: 120
                }];
                let animate = function(g, d, f, e) {
                    setTimeout(function() {
                        Trustindex.animateReviews(b, g + "px", d + "px", f)
                    }, e)
                };
                let position = 0,
                    timeout = 0;
                animates.forEach(function(d, e) {
                    if (e == 0) {
                        position = start + d.pos * multiply
                    } else {
                        start = position;
                        position += d.pos * multiply
                    }
                    animate(start, position, d.speed, timeout);
                    timeout += d.speed
                });
                setTimeout(function() {
                    b.pager_moving = false
                }, timeout)
            },
            animateReviews: function(c, e, d, b) {
                c.querySelectorAll(".ti-review-item").forEach(function(f) {
                    f.animate({
                        left: [e, d]
                    }, {
                        duration: b,
                        fill: "both",
                        easing: "ease-in-out"
                    })
                })
            },
            setClickableParts: function(b) {
                if (typeof b.clickable_parts_setted != "undefined") {
                    return
                }
                b.clickable_parts_setted = true;
                let a = b.querySelector("a[href]");
                if (a && a.getAttribute("href") != "#") {
                    let container = a.closest(".ti-header:not(a), .ti-footer:not(a)");
                    if (container && container.querySelector(".ti-large-logo, .ti-profile-img, .ti-profile-details")) {
                        container.classList.add("ti-clickable-link");
                        container.addEventListener("click", function(c) {
                            if (c.target.nodeName == "A") {
                                return false
                            }
                            Trustindex.openWindow(a.getAttribute("href"));
                            c.preventDefault()
                        })
                    }
                }
            },
            setReadMore: function(b, c) {
                if (typeof c == "undefined") {
                    c = 200
                }
                setTimeout(function() {
                    let loadMoreButtons = b.querySelectorAll(".ti-read-more");
                    if (loadMoreButtons) {
                        loadMoreButtons.forEach(function(d) {
                            let inner = d.closest(".ti-review-content").querySelector(".ti-inner");
                            let fontSize = parseFloat(window.getComputedStyle(inner, null).getPropertyValue("font-size"));
                            let reviewLines = parseInt(window.getComputedStyle(inner, null).getPropertyValue("-webkit-line-clamp"));
                            let maxHeightTest = parseFloat(window.getComputedStyle(inner, null).getPropertyValue("max-height"));
                            let maxHeight = parseInt(fontSize * 1.44 * reviewLines);
                            if (inner.scrollHeight > maxHeight) {
                                d.style.display = "block";
                                d.addEventListener("click", function(f) {
                                    f.preventDefault();
                                    inner.style.setProperty("-webkit-line-clamp", "unset", "important");
                                    inner.style.setProperty("max-height", "unset", "important");
                                    d.style.display = "none"
                                })
                            } else {
                                d.style.display = "none"
                            }
                        })
                    }
                }, c)
            },
            handleSubContents: function(b) {
                let buttons = b.querySelectorAll("a[data-subcontent]");
                buttons.forEach(function(c) {
                    let subcontent_id = c.getAttribute("data-subcontent");
                    let subcontent_target = b.querySelector(c.getAttribute("data-subcontent-target"));
                    if (!subcontent_target || typeof b.pid == "undefined" || !b.pid) {
                        return
                    }
                    if (subcontent_target.innerHTML.trim() != "") {
                        c.setAttribute("data-subcontent-loaded", true);
                        return
                    }
                    c.addEventListener("click", function() {
                        if (!c.getAttribute("data-subcontent-loaded")) {
                            c.classList.add("ti-loading");
                            setTimeout(function() {
                                c.setAttribute("data-subcontent-loaded", true)
                            }, 50);
                            let http = new XMLHttpRequest();
                            http.open("GET", Trustindex.getWidgetUrl(b.pid) + "_subcontent-" + subcontent_id + ".html");
                            http.send();
                            http.onload = function() {
                                if (http.readyState == 4 && http.status == 200) {
                                    subcontent_target.innerHTML = http.responseText;
                                    c.dispatchEvent(new Event("subcontent-loaded"));
                                    c.classList.remove("ti-loading");
                                    Trustindex.formatReviews()
                                }
                            }
                        }
                    })
                })
            },
            formatReviews: function(b) {
                let svg_good = '<svg style="display: inline-block; vertical-align: sub;fill: #0ab21b;position:relative;top:-2px" viewBox="0 0 128 128"><path d="M64 8a56 56 0 1 0 56 56A56 56 0 0 0 64 8zm0 104a48 48 0 1 1 48-48 48 48 0 0 1-48 48zM44 64a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm48-8a8 8 0 1 1-8-8 8 8 0 0 1 8 8zm-4.8 21.6a4 4 0 0 1 .6 3.6A24.3 24.3 0 0 1 64 97c-9.7 0-15.7-4.2-19-7.8a22.7 22.7 0 0 1-4.8-8A4 4 0 0 1 44 76h40a4 4 0 0 1 3.2 1.6z"></path></svg>';
                let svg_bad = '<svg style="display: inline-block; vertical-align: sub;fill: #383838;margin-top: -1px;position:relative;top:-2px" viewBox="0 0 128 128"><path d="M64 8a56 56 0 1 0 56 56A56 56 0 0 0 64 8zm0 104a48 48 0 1 1 48-48 48 48 0 0 1-48 48zM44 64a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm48-8a8 8 0 1 1-8-8 8 8 0 0 1 8 8zm-5.2 30.2a4 4 0 1 1-5.6 5.6c-10.5-10.4-24-10.4-34.4 0a4 4 0 0 1-5.6-5.6c13.6-13.7 32-13.7 45.6 0z"></path></svg>';
                let reviews = document.querySelectorAll(".ti-widget .ti-review-content, .ti-widget .ti-inner .ti-review-text");
                if (reviews && reviews.length) {
                    reviews.forEach(function(c) {
                        let inner = c.querySelector(".ti-inner");
                        if (inner) {
                            c = inner
                        }
                        let svgs = c.querySelectorAll("svg");
                        if (svgs.length == 0) {
                            let html = c.innerHTML;
                            html = html.replace(/<img.+class="emoji" alt="â˜º" src="[^'"]+">/gm, svg_good + "&nbsp;&middot;&nbsp;");
                            html = html.replace(/<img.+class="emoji" alt="â˜¹" src="[^'"]+">/gm, svg_bad + "&nbsp;&middot;&nbsp;");
                            html = html.replace("â˜º", svg_good + "&nbsp;&middot;&nbsp;").replace("â˜¹", svg_bad + "&nbsp;&middot;&nbsp;");
                            html = html.replace(/\n/g, "<br />");
                            c.innerHTML = html;
                            svgs = c.querySelectorAll("svg")
                        }
                        if (svgs.length) {
                            let size = parseInt(c.style.fontSize || 14) * 0.95;
                            svgs.forEach(function(d) {
                                d.style.width = size + "px";
                                d.style.height = size + "px"
                            })
                        }
                        c.innerHTML = Trustindex.decodeHtml(c.innerHTML);
                        let parent = c.closest(".ti-review-item");
                        if (parent) {
                            let sprite_img = parent.querySelector(".ti-profile-img-sprite");
                            if (sprite_img) {
                                let pid = parent.closest(".ti-widget").getAttribute("data-pid");
                                let index = [].indexOf.call(parent.parentNode.children, parent);
                                let style = window.getComputedStyle(sprite_img);
                                let height = parseInt(style.height || "0");
                                if (!height || isNaN(height)) {
                                    height = 40
                                }
                                sprite_img.style.backgroundImage = 'url("' + Trustindex.getWidgetUrl(pid) + 'sprite.jpg")';
                                sprite_img.style.backgroundPosition = "0px " + (index * height * -1) + "px"
                            }
                        }
                    })
                }
                reviews = document.querySelectorAll(".ti-widget .ti-review-item[data-platform-page-url]");
                reviews.forEach(function(c) {
                    let name = c.querySelector(".ti-name");
                    let url = c.getAttribute("data-platform-page-url");
                    name.style.cursor = "pointer";
                    name.addEventListener("click", function(d) {
                        Trustindex.openWindow(url)
                    })
                })
            },
            replaceErrorImages: function() {
                let images = document.querySelectorAll(".ti-widget .ti-review-item .ti-profile-img img");
                if (images && images.length) {
                    images.forEach(function(b) {
                        if (!b.complete) {
                            b.addEventListener("error", function() {
                                this.setAttribute("src", Trustindex.getDefaultAvatarUrl())
                            })
                        } else {
                            if (b.naturalWidth === undefined || b.naturalWidth == 0) {
                                b.setAttribute("src", Trustindex.getDefaultAvatarUrl())
                            }
                        }
                    })
                }
            },
            controlsShowHide: function(b) {
                let num_reviews = b.querySelectorAll(".ti-review-item").length;
                let num_visible_reviews = Trustindex.getVisibleReviewNum(b);
                b.isPrev = true;
                b.isNext = true;
                if (b.pager_state == 0) {
                    Trustindex.toggleElement(b.querySelector(".ti-prev"), "hide");
                    b.pager_autoplay_direction = "next";
                    b.isPrev = false
                } else {
                    Trustindex.toggleElement(b.querySelector(".ti-prev"))
                }
                if (b.pager_state >= num_reviews - num_visible_reviews) {
                    Trustindex.toggleElement(b.querySelector(".ti-next"), "hide");
                    b.pager_autoplay_direction = "prev";
                    b.isNext = false
                } else {
                    Trustindex.toggleElement(b.querySelector(".ti-next"))
                }
                b.querySelectorAll(".dot").forEach(function(c) {
                    c.classList.remove("active")
                });
                let el = b.querySelector('.dot[data-pager-state="' + b.pager_state + '"]');
                if (el) {
                    el.classList.add("active")
                }
            },
            resize_widget: function(c) {
                if (c.container === undefined) {
                    Trustindex.init_widget(c)
                }
                if (typeof c.original_cols == "undefined") {
                    let class_name = c.container.classList.toString();
                    if (class_name.indexOf("ti-col-") == -1) {
                        c.original_cols = 1
                    } else {
                        c.original_cols = parseInt(class_name.replace(/^.*ti-col-(\d+).*$/, "$1"))
                    }
                }
                if (c.original_cols <= 1) {
                    return false
                }
                let col_count = 5;
                if (c.container.offsetWidth > c.reviews_container.offsetWidth) {
                    if (c.offsetWidth < 520) {
                        c.container.setAttribute("class", "ti-widget-container ti-col-1");
                        col_count = 1
                    } else {
                        if (c.offsetWidth < 750) {
                            c.container.setAttribute("class", "ti-widget-container ti-col-2");
                            col_count = 1
                        } else {
                            if (c.offsetWidth < 1100) {
                                c.container.setAttribute("class", "ti-widget-container ti-col-3");
                                col_count = 2
                            } else {
                                if (c.offsetWidth < 1450) {
                                    c.container.setAttribute("class", "ti-widget-container ti-col-4");
                                    col_count = 3
                                } else {
                                    if (c.offsetWidth < 1800) {
                                        c.container.setAttribute("class", "ti-widget-container ti-col-5");
                                        col_count = 4
                                    } else {
                                        c.container.setAttribute("class", "ti-widget-container ti-col-6");
                                        col_count = 5
                                    }
                                }
                            }
                        }
                    }
                } else {
                    if (c.offsetWidth < 540) {
                        c.container.setAttribute("class", "ti-widget-container ti-col-1");
                        col_count = 1
                    } else {
                        if (c.offsetWidth < 760) {
                            c.container.setAttribute("class", "ti-widget-container ti-col-2");
                            col_count = 2
                        } else {
                            if (c.offsetWidth < 1200) {
                                c.container.setAttribute("class", "ti-widget-container ti-col-3");
                                col_count = 3
                            } else {
                                if (c.offsetWidth < 1550) {
                                    c.container.setAttribute("class", "ti-widget-container ti-col-4");
                                    col_count = 4
                                } else {
                                    c.container.setAttribute("class", "ti-widget-container ti-col-5");
                                    col_count = 5
                                }
                            }
                        }
                    }
                }
                if (c.getAttribute("data-column-vertical-separate") || c.layout_id == 31) {
                    let reviews = c.container.querySelectorAll(".ti-review-item");
                    c.reviews_container_wrapper.innerHTML = "";
                    for (var b = 0, d = []; b < col_count; b++) {
                        d[b] = document.createElement("div");
                        d[b].setAttribute("class", "ti-column");
                        c.reviews_container_wrapper.appendChild(d[b])
                    }
                    reviews.forEach(function(f, e) {
                        d[e % col_count].appendChild(f)
                    })
                }
                Trustindex.init_dots(c);
                Trustindex.slideReviews(c)
            },
            resize_widgets: function() {
                document.querySelectorAll(".ti-widget").forEach(function(b) {
                    Trustindex.resize_widget(b)
                })
            },
            decodeHtml: function(c) {
                var b = document.createElement("textarea");
                b.innerHTML = c;
                return b.value
            },
            toggleElement: function(c, b) {
                if (b === undefined) {
                    b = "show"
                }
                if (c) {
                    c.style.display = b == "show" ? "block" : "none"
                }
            },
            getVisibleReviewNum: function(b) {
                let num_visible_reviews = parseInt(b.container.classList.toString().replace(/^.*ti-col-(\d+).*$/, "$1"));
                if (b.container.offsetWidth > b.reviews_container.offsetWidth) {
                    num_visible_reviews -= 1
                }
                return Math.max(num_visible_reviews, 1)
            },
            addCSS: function(b, c) {
                let link = document.createElement("link");
                link.type = "text/css";
                link.rel = "stylesheet";
                link.href = b;
                document.head.appendChild(link);
                if (c) {
                    link.addEventListener("load", c)
                }
            },
            popupHandler: function(b) {
                let button = b.target;
                let toggle = function() {
                    button.classList.toggle("active");
                    let widget = button.closest(".ti-widget");
                    if (widget) {
                        let popups = widget.querySelectorAll(".ti-dropdown-widget, .ti-popup-widget");
                        popups.forEach(function(c) {
                            c.classList.toggle("active")
                        });
                        Trustindex.setReadMore(widget, 10)
                    }
                    button.removeEventListener("subcontent-loaded", toggle)
                };
                if (button.matches('a[href="#dropdown"]') || button.matches('a[href="#popup"]')) {
                    if (!button.getAttribute("data-subcontent-loaded")) {
                        button.addEventListener("subcontent-loaded", toggle)
                    } else {
                        toggle()
                    }
                    b.preventDefault()
                }
            },
            popupCloseHandler: function(b) {
                if (b.target.matches(".ti-header .ti-close-lg")) {
                    b.preventDefault();
                    let widget = b.target.closest(".ti-widget");
                    if (widget) {
                        let header = widget.querySelector("a.ti-header[href]");
                        if (header) {
                            header.click()
                        }
                    }
                }
            },
            openWindow: function(b) {
                let a = document.createElement("a");
                a.href = b;
                a.target = "_blank";
                a.rel = "noopener noreferrer nofollow";
                a.click()
            },
            getCookie: function(b) {
                return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(b).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null
            },
            setCookie: function(b, e, c, f, d) {
                let exdate = new Date();
                exdate.setDate(exdate.getDate() + c);
                let expires = (c == null ? "" : "; expires=" + exdate.toUTCString());
                document.cookie = encodeURIComponent(b) + "=" + encodeURIComponent(e) + expires + (d ? "; domain=" + d : "") + (f ? "; path=" + f : "");
                return true
            },
            removeCookie: function(b, d, c) {
                if (!b || Trustindex.getCookie(b) === null) {
                    return false
                }
                document.cookie = encodeURIComponent(b) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (c ? "; domain=" + c : "") + (d ? "; path=" + d : "");
                return true
            }
        }
    }();
    Trustindex.init()
} else {
    Trustindex.init()
};
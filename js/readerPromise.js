;
(function () {
  var Storage = {
    localData: 'reader_html5',
    get: function (key) {
      return localStorage.getItem(this.localData + key);
    },
    set: function (key, val) {
      return localStorage.setItem(this.localData + key, val);
    },
    getJsonp: function (url, callback) {
      return $.jsonp({
        url: url,
        cache: true,
        callback: 'duokan_fiction_chapter', //
        success: function (res) {
          let data = $.base64.decode(res);
          let json = decodeURIComponent(escape(data));
          callback(json);
        }
      })
    }
  }


  // 多次使用的dom节点
  let Dom = {
    nav: $('nav'), //返回菜单
    footer: $('footer'), //底部设置
    fontSetting: $('.fontSetting'), //字体设置
    fontContainer: $('#container'), //内容主体
    wraper: $('#wraper') //内容和翻页键的容器
  }
  // 初始设置
  let initSetting = {
    fontSize: parseInt(Storage.get('fontSize')) || 14,
    bgColor: Storage.get('bgColor') || '#ccc'
  }
  Dom.wraper.css('font-size', initSetting.fontSize);
  Dom.wraper.css('background-color', initSetting.bgColor);
  var readerModel;
  var readerUI;

  function main() {
    EventHandle();
    readerModel = ReaderModel();
    readerUI = ReaderBaseFrame(Dom.fontContainer);
    readerModel.init(function (data) {
      readerUI.renderHtml(data)
    });
  }

  //处理事件  界面交互事件 Event层 C
  function EventHandle() {
    $('.user-touch').click(function () {
      // 点击屏幕弹出菜单
      if (Dom.nav.css('display') == 'none') {
        Dom.nav.show();
        Dom.footer.show();
      } else {
        Dom.nav.hide();
        Dom.footer.hide();
        Dom.fontSetting.hide();
      }

    })
    // 点击字体时弹出字体设置菜单
    $('.font').click(function () {
      if (Dom.fontSetting.css('display') == 'none') {
        Dom.fontSetting.show();
      } else {
        Dom.fontSetting.hide();
      }

    })
    // 加大字体
    $('#btn-big').click(function () {
      if (initSetting.fontSize >= 25) return
      initSetting.fontSize += 1;
      Dom.fontContainer.css('font-size', initSetting.fontSize);
      Storage.set('fontSize', initSetting.fontSize);
    })
    //缩小字体
    $('#btn-small').click(function () {
      if (initSetting.fontSize <= 12) return
      initSetting.fontSize -= 1;
      Dom.fontContainer.css('font-size', initSetting.fontSize);
      Storage.set('fontSize', initSetting.fontSize);
    })
    //改变前景
    $('.fontBg .bgColor').click(function () {
      let color = $(this).css('background-color');
      Dom.wraper.css('background-color', color);
      Storage.set('bgColor', color);
    })
    // 夜间模式
    $('.night').click(function () {
      Dom.wraper.css('background-color', '#c0c0c0');
      Storage.set('bgColor', '#c0c0c0');
    })
    // 滚动时隐藏菜单
    $(window).scroll(function () {
      Dom.nav.hide();
      Dom.footer.hide();
      Dom.fontSetting.hide();
    })

    var ScrollTop = function (number = 0, time) {
      if (!time) {
        document.body.scrollTop = document.documentElement.scrollTop = number;
        return number;
      }
      const spacingTime = 200; // 设置循环的间隔时间  值越小消耗性能越高
      let spacingInex = time / spacingTime; // 计算循环的次数
      let nowTop = document.body.scrollTop + document.documentElement.scrollTop; // 获取当前滚动条位置
      let everTop = (number - nowTop) / spacingInex; // 计算每次滑动的距离
      let scrollTimer = setInterval(() => {
        if (spacingInex > 0) {
          spacingInex--;
          ScrollTop(nowTop += everTop);
        } else {
          clearInterval(scrollTimer); // 清除计时器
        }
      }, spacingTime);
    };
    // 点击上一章获取数据
    $('#prev').click(function () {
      readerModel.preChapter(function (data) {
        readerUI.renderHtml(data)

        // Dom.wraper.css('top', 0)

      });
      // Dom.wraper.scrollTop = 100;

      ScrollTop(0, 200)
    })

    // 点击下一章获取数据
    $('#next').click(function () {
      readerModel.nextChapter(function (data) {
        readerUI.renderHtml(data)
        $(window).scrollBottom = 100 + 'px';
      });
    })
  }

  // 数据交互 Model层 M
  function ReaderModel() {
    let chapterId;
    let chapterTotal;
    // var init = function (UIcallback) {
    //   getFictionInfo(function (ficData) {
    //     getCurChapter(chapterId, function (data) {
    //       //获得数据
    //       //data为小説内容  ficdata为所有章节信息
    //       // debugger
    //       UIcallback(data, ficData);
    //     })
    //   })
    // }
    var init = function (UIcallback) {
      // getFictionInfo().then(function (ficData) {
      //   // debugger
      //   // console.log(ficData);
      //   // UIcallback(ficData)
      //   return getCurChapter();
      // }).then(function (data) {
      //   // debugger
      //   UIcallback(data, ficData)
      // })
      getFictionInfo().then(getCurChapter)
        .then(function (data) {
          // debugger
          UIcallback(data)
        })
    }
    var getFictionInfo1 = function () {
      return new Promise(function (resolve, reject) {
        $.get('data/chapter.json', function (data) {
          if (data.result == 0) {
            resolve(data)
          } else {
            reject({
              err: '请求数据失败'
            })
          }
        })
      }, 'json')
    }
    getFictionInfo1().then(function (data) {
      let chapterId = data.chapters[1].chapter_id;
      return new Promise(function (resolve, reject) {
        $.get('data/data' + chapterId + '.json', function (data) {
          if (data.result == 0) {
            let url = data.jsonp;
            Storage.getJsonp(url, function (data) {
              resolve(data)
            })
          } else {
            reject('请求章节信息失败!')
          }
        }, 'json')
      })
    })
      .then(function (data) {
        console.log(data);

      })
    var getFictionInfo = function () {
      return new Promise(function (resolve, reject) {
        // 获取章节信息
        $.get('data/chapter.json', function (ficData) {
          if (ficData.result == 0) {
            chapterTotal = ficData.chapters.length;
            chapterId = parseInt(Storage.get('lastChapter'), 10) || ficData.chapters[1].chapter_id;
            // callback && callback(ficData);
            resolve(ficData);
          } else {
            reject({
              msg: '请求数据失败'
            });
          }
        }, 'json')
      })
    }
    // var getFictionInfo = function (callback) {
    //   // 获取章节信息
    //   $.get('data/chapter.json', function (ficData) {
    //     chapterTotal = ficData.chapters.length;
    //     chapterId = parseInt(Storage.get('lastChapter'), 10) || ficData.chapters[1].chapter_id;
    //     callback && callback(ficData);
    //   }, 'json')

    // }
    //获取当前章节的内容
    // var getCurChapter = function (chapter_id, callback) {
    //   $.get('data/data' + chapter_id + '.json', function (data) {
    //     if (data.result == 0) {
    //       let url = data.jsonp; //key为jsonp
    //       Storage.getJsonp(url, function (data) {
    //         callback && callback(data);
    //       })
    //     }
    //   }, 'json')
    // }
    var getCurChapter = function () {
      return new Promise(function (resolve, reject) {
        $.get('data/data' + chapterId + '.json', function (data) {
          if (data.result == 0) {
            let url = data.jsonp; //key为jsonp
            Storage.getJsonp(url, function (data) {
              // callback && callback(data);
              resolve(data)

            })
          } else {
            reject({
              error: '获取文章内容失败'
            })
          }
        }, 'json')
      })
    }
    // 上一章
    var preChapter = function (callback) {
      if (chapterId == 0) return

      chapterId -= 1;
      Storage.set('lastChapter', chapterId);
      getCurChapter(chapterId, function (data) {
        callback && callback(data);
      });
    }
    //下一章
    var nextChapter = function (callback) {
      if (chapterId == chapterTotal) return
      chapterId += 1;
      Storage.set('lastChapter', chapterId);
      getCurChapter(chapterId, function (data) {
        callback && callback(data);
      });
    }
    return {
      init: init,
      preChapter: preChapter,
      nextChapter: nextChapter
    }
  }
  // 渲染页面结构 UI层 V
  var ReaderBaseFrame = function (el) {
    var renderHtml = function (data) {
      let chapter = JSON.parse(data);
      let title = '<div id="fiction_chapter_title"><h4>' + chapter.t + '</h4></div>';
      let p = '';
      chapter.p.forEach(item => {
        p += '<p>' + item + '</p>';
      })
      el.html(title + p);
    }
    return {
      renderHtml: renderHtml
    }
  }
  main();
})()
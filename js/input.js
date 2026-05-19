// ==================== 输入控制 input.js ====================
(function() {
    var G = window.G;
    G.inputX = G.W / 2;

    window.addEventListener('mousemove', function(e) {
        G.inputX = e.clientX;
    });
    window.addEventListener('touchmove', function(e) {
        if (e.touches.length > 0) G.inputX = e.touches[0].clientX;
    }, {passive: true});
    window.addEventListener('touchstart', function(e) {
        if (e.touches.length > 0) G.inputX = e.touches[0].clientX;
    }, {passive: true});

    G.inputUpdate = function() {
        // 由 playerUpdate 处理移动，input只负责更新inputX
    };
})();

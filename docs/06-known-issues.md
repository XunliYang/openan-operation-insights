# 06 已知问题

## 2026-09-23 IDE WebView 控制台报错

现象：WebView 打开 `/activity` 报 `Script error.` 与 `getBoundingClientRect` 空引用。

取证：agent-browser 独立浏览器冷加载与交互矩阵（切换指标、tooltip、路由往返、缩放、HMR）全程零报错，渲染正常。

结论：WebView 注入脚本对 HMR 移除节点操作所致，非应用缺陷。

处置：`EChart.tsx` 加 isDisposed 守卫并修正注释；回归通过。

---
# Leave the homepage title empty to use the site title
title: ''
summary: ''
date: 2026-10-03
type: landing

sections:
  - block: resume-biography-3
    content:
      username: me
      text: ''
      headings:
        about: ''
        education: ''
        interests: ''
    design:
      background:
        gradient_mesh:
          enable: true
      name:
        size: md
      avatar:
        size: medium
        shape: circle

  - block: markdown
    id: research
    content:
      title: '🔬 研究方向'
      subtitle: ''
      text: |-
        我的核心研究方向是**投资组合优化**（Portfolio Optimization）。一切始于 Markowitz (1952) 的均值—方差框架：

        $$\min_{w}\ w^{\top}\Sigma w \quad \text{s.t.}\quad w^{\top}\mu \geq r_{\text{target}},\ \mathbf{1}^{\top}w = 1,\ w \geq 0$$

        经典框架在实际应用中面临估计误差敏感、协方差矩阵病态等问题，我的关注点包括：

        - **鲁棒优化**：在最坏情形扰动集下保证解的稳健性
        - **分布鲁棒优化（DRO）**：在模糊概率集合（如 Wasserstein 球）上优化期望目标
        - **参数不确定性**下的组合选择与正则化方法

        相关代码与实验笔记见 [GitHub](https://github.com/songyu0903)。
    design:
      columns: '1'

  - block: collection
    id: notes
    content:
      title: 📝 笔记
      subtitle: ''
      text: ''
      page_type: blog
      count: 0
      filters:
        author: ''
        category: ''
        tag: ''
        exclude_featured: false
        exclude_future: false
        exclude_past: false
        publication_type: ''
      offset: 0
      order: desc
    design:
      view: card
      columns: 2
      spacing:
        padding: [0, 0, 0, 0]
---

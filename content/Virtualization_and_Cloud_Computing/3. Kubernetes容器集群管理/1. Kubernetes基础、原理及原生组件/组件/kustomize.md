---
title: "[组件]kustomize--Kubernetes配置文件管理"
layout: page
date: 2099-06-02 00:00
---
[TOC]

# 概述
kustomize 是Kubernetes 原生的**配置文件**管理组件
```
kustomize is Kubernetes native configuration management
```

kustomize[Github链接](https://github.com/kubernetes-sigs/kustomize)在代码仓库的描述为：
**Customization of kubernetes YAML configurations**

kustomize 明显就是解决 kubernetes yaml 应用管理的问题的。

kustomize项目嵌入到了 `kubectl`命令中去了，通过使用`kubectl apply -k `命令使用。

# 安装

安装文档参考：https://github.com/kubernetes-sigs/kustomize/blob/master/docs/zh/INSTALL.md

```shell
# 推荐
curl -s "https://raw.githubusercontent.com/\
kubernetes-sigs/kustomize/master/hack/install_kustomize.sh"  | bash
```


# 参考资料

[^1]:[官网](https://kustomize.io/)






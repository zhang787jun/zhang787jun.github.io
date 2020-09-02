---
title: "Tensorflow Gfile文件操作
 "
date: 2019-06-12 00:00
render: True 
tag: Tensorflow,框架,AI,
---
[TOC]

1、提供了一种类似于python文件操作的API；
2、提供了一种操作tensorflow C++文件系统的API；
tensorflow c++文件操作接口支持多个文件系统实现，包括本地文件、谷歌云存储(以gs://开头)和HDFS(以HDFS://开头)，tensorflow封装这些接口到tf.gfile，以便我们可以使用这些接口来存储和加载检查点文件、将tensorboard log信息写到文本里以及访问训练数据(在其他用途里)。但是，如果所有文件都放在本地，那么我们直接使用python提供的常规文本操作接口也是一样效果且毫无问题的！
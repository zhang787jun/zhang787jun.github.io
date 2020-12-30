---
title: "01_FFmpeg--基础"
layout: page
date: 2099-06-02 00:00
---

[TOC]




GStreamer-多媒体框架
FFMPEG-容器解析器，音频/视频解码器的软件实现，软件缩放，
Plain GStreamer没有插件就无法做任何事情，GStreamer需要各种插件，


FFmpeg 是视频处理最常用的开源软件。

它功能强大，用途广泛，大量用于视频网站和商业软件（比如 Youtube 和 iTunes），也是许多音频和视频格式的标准编码/解码实现。

# 1. 背景

## 1.1. 视频文件就是容器
视频文件本身其实是一个容器（container），里面包括了视频和音频，也可能有字幕等其他内容

## 1.2. 编码格式

```shell
# 查看 FFmpeg 支持的容器。
ffmpeg -formats

# 查看 FFmpeg 支持的编码格式。
ffmpeg -codecs

# 查看 FFmpeg 支持的编码格式。
ffmpeg -encoders
```



# 2. 安装

```shell
# FFmpeg dev package
sudo apt install libavcodec-dev
```
# 3. FFmpeg 的使用格式
FFmpeg 的命令行参数非常多，可以分成五个部分。


```shell
ffmpeg {1} {2} -i {3} {4} {5}

1. 全局参数
2. 输入文件参数
3. 输入文件
4. 输出文件参数
5. 输出文件
```

```shell
ffmpeg \
-y \ # 全局参数
-c:a libfdk_aac -c:v libx264 \ # 输入文件参数
-i input.mp4 \ # 输入文件
-c:v libvpx-vp9 -c:a libvorbis \ # 输出文件参数
output.webm # 输出文件
```

如果不指明编码格式，FFmpeg 会自己判断输入文件的编码。因此，上面的命令可以简单写成下面的样子。


```shell
ffmpeg -i input.avi output.mp4
```
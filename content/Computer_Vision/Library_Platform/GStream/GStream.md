---
title: "01_Gstream--基础"
layout: page
date: 2099-06-02 00:00
---

[TOC]

# 1. 什么是 Gstream

[Gstream](https://gstreamer.freedesktop.org/) is a multimedia framework（**框架**）that creates a pipeline based workflow for various types of media source.

Gstreamer是一个支持Windows、Linux、Android， iOS的跨平台的多媒体框架，应用程序可以通过管道（Pipeline）的方式，将多媒体处理的各个步骤串联起来，达到预期的效果。每个步骤通过元素（Element）基于GObject对象系统通过插件（plugins）的方式实现，方便了各项功能的扩展。

Plain GStreamer 没有插件就无法做任何事情，GStreamer需要各种插件，

## 1.1. 安装

```python
# GStreamer library and plugins
sudo apt install \
    libgstreamer1.0-dev \
    gstreamer1.0-plugins-{base,good,bad} \
    libgstreamer-plugins-{base,good,bad}1.0-dev \
    gstreamer1.0-libav \
    gstreamer1.0-vaapi
```

## 1.2. 组成

gstreamer库主要包含：
1. `gstreamer`: the core package
gst-plugins-base: an essential exemplary set of elements
2. `gst-plugins-<quality>`
   1. `gst-plugins-good`: a set of good-quality plug-ins under LGPL
   2. `gst-plugins-ugly`: a set of good-quality plug-ins that might pose distribution problems
   3. `gst-plugins-bad`: a set of plug-ins that need more quality
3. `gst-libav`: a set of plug-ins that wrap libav for decoding and encoding

4. a few others packages

### 1.2.1. 核心 Core package
### 1.2.2. 插件 Plugins
最下层为各种插件，实现具体的数据处理及音视频输出，应用不需要关注插件的细节，会由Core Framework层负责插件的加载及管理。主要分类为：

1. Protocols：负责各种协议的处理，file，http，rtsp等。
2. Sources：负责数据源的处理，alsa，v4l2，tcp/udp等。
3. Formats：负责媒体容器的处理，avi，mp4，ogg等。
4. Codecs：负责媒体的编解码，mp3，vorbis等。
5. Filters：负责媒体流的处理，converters，mixers，effects等。
6. Sinks：负责媒体流输出到指定设备或目的地，alsa，xvideo，tcp/udp等。



### 1.2.3. 命令行工具gstreamer tools

Gstreamer自带了gst-inspect-1.0和gst-launch-1.0等其他命令行工具，我们可以使用这些工具完成常见的处理任务。

#### 1.2.3.1. gst-inspect-1.0

查看gstreamer的plugin、element的信息。直接将plugin/element的类型作为参数，会列出其详细信息。

如果不跟任何参数，会列出当前系统gstreamer所能查找到的所有插件。

```shell
# 列出当前系统gstreamer所能查找到的所有插件
gst-inspect-1.0 playbin
```
#### 1.2.3.2. gst-launch-1.0

用于创建及执行一个Pipline，因此通常使用`gst-launch` 先验证相关功能，然后再编写相应应用。


通过上面ogg视频播放的例子，我们已经看到，**一个pipeline的多个element之间通过 "!" 分隔**，同时可以设置element及Cap的属性。例如：
> **关键**
使用 <**!**> 分割
```shell
# 播放音视频
gst-launch-1.0 playbin file:///home/root/test.mp4

# 转码
gst-launch-1.0 filesrc location=/videos/sintel_trailer-480p.ogv ! decodebin name=decode ! \
videoscale ! "video/x-raw,width=320,height=240" ! x264enc ! queue ! \
mp4mux name=mux ! filesink location=320x240.mp4 decode. ! audioconvert ! \
avenc_aac ! queue ! mux.


# Streaming

# Server
gst-launch-1.0 -v videotestsrc ! "video/x-raw,framerate=30/1" ! x264enc key-int-max=30 ! rtph264pay ! udpsink host=127.0.0.1 port=1234

#Client
gst-launch-1.0 udpsrc port=1234 ! "application/x-rtp, payload=96" ! rtph264depay ! decodebin ! autovideosink sync=fa
```

# 2. 基本概念

## 2.1. Element
Element是Gstreamer中最重要的对象类型之一。
1个element实现1个功能（读取文件，解码，输出等），程序需要创建多个element，并按顺序将其串连起来，构成一个完整的pipeline。

## 2.2. Pad
Pad是一个element的输入/输出接口，分为两种：
1. src pad（生产数据）
2. sink pad（消费数据）

两个element必须通过pad才能连接起来，pad拥有当前element能处理数据类型的能力（capabilities），会在连接时通过比较src pad和sink pad中所支持的能力，来选择最恰当的数据类型用于传输，如果element不支持，程序会直接退出。在element通过pad连接成功后，数据会从上一个element的src pad传到下一个element的sink pad然后进行处理。
当element支持多种数据处理能力时，我们可以通过Cap来指定数据类型.

例如，下面的命令通过Cap指定了视频的宽高，videotestsrc会根据指定的宽高产生相应数据：

```shell
gst-launch-1.0 videotestsrc ! "video/x-raw,width=1280,height=720" ! autovideosink
```
## 2.3. Bin和Pipeline
Bin是一个容器，用于管理多个element，改变bin的状态时，bin会自动去修改所包含的element的状态，也会转发所收到的消息。如果没有bin，我们需要依次操作我们所使用的element。通过bin降低了应用的复杂度。
Pipeline继承自bin，为程序提供一个bus用于传输消息，并且对所有子element进行同步。当将pipeline的状态设置为PLAYING时，pipeline会在一个/多个新的线程中通过element处理数据。


# 3. 数据消息交互
在pipeline运行的过程中，各个element以及应用之间不可避免的需要进行数据消息的传输，gstreamer提供了bus系统以及多种数据类型（Buffers、Events、Messages，Queries）来达到此目的：

## 3.1. Bus
Bus是gstreamer内部用于将消息从内部不同的streaming线程，传递到bus线程，再由bus所在线程将消息发送到应用程序。应用程序只需要向bus注册消息处理函数，即可接收到pipline中各element所发出的消息，使用bus后，应用程序就不用关心消息是从哪一个线程发出的，避免了处理多个线程同时发出消息的复杂性。

## 3.2. Buffers
用于从sources到sinks的媒体数据传输。

## 3.3. Events
用于element之间或者应用到element之间的信息传递，比如播放时的seek操作是通过event实现的。

## 3.4. Messages
是由element发出的消息，通过bus，以异步的方式被应用程序处理。通常用于传递errors, tags, state changes, buffering state, redirects等消息。消息处理是线程安全的。由于大部分消息是通过异步方式处理，所以会在应用程序里存在一点延迟，如果要及时的相应消息，需要在streaming线程捕获处理。

## 3.5. Queries
用于应用程序向gstreamer查询总时间，当前时间，文件大小等信息。



# 4. test
##初始化


```C++
/* Initialize GStreamer */
gst_init (&argc, &argv);
```
首先我们调用了gstreamer的初始化函数，**该初始化函数必须在其他gstreamer接口之前被调用**，gst_init会负责以下资源的初始化：

1. 初始化GStreamer库
2. 注册内部element
3. 加载插件列表，扫描列表中及相应路径下的插件
4. 解析并执行命令行参数

在不需要gst_init处理命令行参数时，我们可以讲NULL作为其参数，例如：gst_init(NULL, NULL);

## 4.1. 创建Pipeline
　　当我们用字符串描述Pipeline时，每个Element之间需要通过叹号 “!" 分隔Element，这样gst-launch才能正确识别。
　　在使用gst-launch时，根据不同的应用场景，我们可以分为以下的类型。

采用默认的参数创建Pipeline
　　这种方式我们只需将所使用的Element使用叹号分隔即可，例如：

```shell
gst-launch-1.0 videotestsrc ! videoconvert ! autovideosink
```

```python

import sys
import argparse
import cv2
 
WINDOW_NAME = 'CameraDemo'
 
def parse_args():
    # Parse input arguments
    desc = 'Capture and display live camera video on Jetson TX2/TX1'
    parser = argparse.ArgumentParser(description=desc)
    parser.add_argument('--rtsp', dest='use_rtsp',
                        help='use IP CAM (remember to also set --uri)',
                        action='store_true')
    parser.add_argument('--uri', dest='rtsp_uri',
                        help='RTSP URI, e.g. rtsp://192.168.1.64:554',
                        default=None, type=str)
    parser.add_argument('--latency', dest='rtsp_latency',
                        help='latency in ms for RTSP [200]',
                        default=200, type=int)
    parser.add_argument('--usb', dest='use_usb',
                        help='use USB webcam (remember to also set --vid)',
                        action='store_true')
    parser.add_argument('--vid', dest='video_dev',
                        help='device # of USB webcam (/dev/video?) [1]',
                        default=1, type=int)
    parser.add_argument('--width', dest='image_width',
                        help='image width [1920]',
                        default=1920, type=int)
    parser.add_argument('--height', dest='image_height',
                        help='image height [1080]',
                        default=1080, type=int)
    args = parser.parse_args()
    return args
 
def open_cam_rtsp(uri, width, height, latency):
    gst_str = ('rtspsrc location={} latency={} ! '
               'rtph264depay ! h264parse ! omxh264dec ! '
               'nvvidconv ! '
               'video/x-raw, width=(int){}, height=(int){}, '
               'format=(string)BGRx ! '
               'videoconvert ! appsink').format(uri, latency, width, height)
    return cv2.VideoCapture(gst_str, cv2.CAP_GSTREAMER)
 
def open_cam_usb(dev, width, height):
    # We want to set width and height here, otherwise we could just do:
    #     return cv2.VideoCapture(dev)
    gst_str = ('v4l2src device=/dev/video{} ! '
               'video/x-raw, width=(int){}, height=(int){}, '
               'format=(string)RGB ! '
               'videoconvert ! appsink').format(dev, width, height)
    return cv2.VideoCapture(gst_str, cv2.CAP_GSTREAMER)
 
def open_cam_onboard(width, height):
    # On versions of L4T prior to 28.1, add 'flip-method=2' into gst_str
    gst_str = ('nvcamerasrc ! '
               'video/x-raw(memory:NVMM), '
               'width=(int)2592, height=(int)1458, '
               'format=(string)I420, framerate=(fraction)30/1 ! '
               'nvvidconv ! '
               'video/x-raw, width=(int){}, height=(int){}, '
               'format=(string)BGRx ! '
               'videoconvert ! appsink').format(width, height)
    return cv2.VideoCapture(gst_str, cv2.CAP_GSTREAMER)
 
def open_window(width, height):
    cv2.namedWindow(WINDOW_NAME, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(WINDOW_NAME, width, height)
    cv2.moveWindow(WINDOW_NAME, 0, 0)
    cv2.setWindowTitle(WINDOW_NAME, 'Camera Demo for Jetson TX2/TX1')
 
def read_cam(cap):
    show_help = True
    full_scrn = False
    help_text = '"Esc" to Quit, "H" for Help, "F" to Toggle Fullscreen'
    font = cv2.FONT_HERSHEY_PLAIN
    while True:
        if cv2.getWindowProperty(WINDOW_NAME, 0) < 0:
            # Check to see if the user has closed the window
            # If yes, terminate the program
            break
        _, img = cap.read() # grab the next image frame from camera
        if show_help:
            cv2.putText(img, help_text, (11, 20), font,
                        1.0, (32, 32, 32), 4, cv2.LINE_AA)
            cv2.putText(img, help_text, (10, 20), font,
                        1.0, (240, 240, 240), 1, cv2.LINE_AA)
        cv2.imshow(WINDOW_NAME, img)
        key = cv2.waitKey(10)
        if key == 27: # ESC key: quit program
            break
        elif key == ord('H') or key == ord('h'): # toggle help message
            show_help = not show_help
        elif key == ord('F') or key == ord('f'): # toggle fullscreen
            full_scrn = not full_scrn
            if full_scrn:
                cv2.setWindowProperty(WINDOW_NAME, cv2.WND_PROP_FULLSCREEN,
                                      cv2.WINDOW_FULLSCREEN)
            else:
                cv2.setWindowProperty(WINDOW_NAME, cv2.WND_PROP_FULLSCREEN,
                                      cv2.WINDOW_NORMAL)
 
def main():
    args = parse_args()
    print('Called with args:')
    print(args)
    print('OpenCV version: {}'.format(cv2.__version__))
 
    if args.use_rtsp:
        cap = open_cam_rtsp(args.rtsp_uri,
                            args.image_width,
                            args.image_height,
                            args.rtsp_latency)
    elif args.use_usb:
        cap = open_cam_usb(args.video_dev,
                           args.image_width,
                           args.image_height)
    else: # by default, use the Jetson onboard camera
        cap = open_cam_onboard(args.image_width,
                               args.image_height)
 
    if not cap.isOpened():
        sys.exit('Failed to open camera!')
 
    open_window(args.image_width, args.image_height)
    read_cam(cap)
 
    cap.release()
    cv2.destroyAllWindows()
 
if __name__ == '__main__':
    main()
```
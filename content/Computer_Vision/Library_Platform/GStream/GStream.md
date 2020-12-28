---
title: "01_gstream--基础"
layout: page
date: 2099-06-02 00:00
---

[TOC]

# 1. 什么是 gstream
[gstream](https://gstreamer.freedesktop.org/) is a multimedia framework（**框架**）that creates a pipeline based workflow for various types of media source.

Plain GStreamer没有插件就无法做任何事情，GStreamer需要各种插件，

# 2. 安装


```python
# GStreamer library and plugins
sudo apt install \
    libgstreamer1.0-dev \
    gstreamer1.0-plugins-{base,good,bad} \
    libgstreamer-plugins-{base,good,bad}1.0-dev \
    gstreamer1.0-libav \
    gstreamer1.0-vaapi
# FFmpeg dev package
sudo apt install libavcodec-dev
```

## 组成

gstreamer库主要包含:
1. 核心
2. 组件
3. 转码插件
-----
gstreamer库主要包含：
1. `gstreamer`: the core package
gst-plugins-base: an essential exemplary set of elements
2. `gst-plugins-<quality>`
   1. `gst-plugins-good`: a set of good-quality plug-ins under LGPL
   2. `gst-plugins-ugly`: a set of good-quality plug-ins that might pose distribution problems
   3. `gst-plugins-bad`: a set of plug-ins that need more quality
3. `gst-libav`: a set of plug-ins that wrap libav for decoding and encoding

4. a few others packages


# 插件 Plugins


最下层为各种插件，实现具体的数据处理及音视频输出，应用不需要关注插件的细节，会由Core Framework层负责插件的加载及管理。主要分类为：

1. Protocols：负责各种协议的处理，file，http，rtsp等。
2. Sources：负责数据源的处理，alsa，v4l2，tcp/udp等。
3. Formats：负责媒体容器的处理，avi，mp4，ogg等。
4. Codecs：负责媒体的编解码，mp3，vorbis等。
5. Filters：负责媒体流的处理，converters，mixers，effects等。
6. Sinks：负责媒体流输出到指定设备或目的地，alsa，xvideo，tcp/udp等。

Gstreamer框架根据各个模块的成熟度以及所使用的开源协议，将core及plugins置于不同的源码包中：

gstreamer: 包含core framework及core elements。
gst-plugins-base: gstreamer应用所需的必要插件。
gst-plugins-good: 高质量的采用LGPL授权的插件。
gst-plugins-ugly: 高质量，但使用了GPL等其他授权方式的库的插件，比如使用GPL的x264，x265。
gst-plugins-bad: 质量有待提高的插件，成熟后可以移到good插件列表中。
gst-libav: 对libav封装，使其能在gstreamer框架中使用。

Gstreamer是一个支持Windows、Linux、Android， iOS的跨平台的多媒体框架，应用程序可以通过管道（Pipeline）的方式，将多媒体处理的各个步骤串联起来，达到预期的效果。每个步骤通过元素（Element）基于GObject对象系统通过插件（plugins）的方式实现，方便了各项功能的扩展。

下图是对基于Gstreamer框架的应用的简单分层：



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
---
title: "算力核心-GPU"
layout: page
date: 2099-06-02 00:00
---

[TOC]
# 1. GPU 硬件性能

## 英伟达GPU 系列



Nvidia的GPU命名有4个层次：

1. GPU 架构(microarchitecture)
   表示GPU在芯片设计层面上的不同处理方式，包括的内容有计算单元(SIMD)的个数、有无L1,L2缓存、是否有双精度支持等。按时间顺序依次是：
   `Tesla-> Fermi-> Keple -> Maxwell-> Pascal`
2. 显卡系列：
根据使用场景的不同，分成GeForce, Quadro, Tesla。

- `GeForce` 用于家庭和个人电脑，包括游戏和娱乐等;
- `Quadro` 用于工业渲染、艺术设计，工作站等场合。
- `Tesla` 用于科学计算，深度学习加速等场景。

当然这三者的使用场景并没有严格的边界，想GeForce 系列的GTX 1080也可以用来做深度学习实验。

3. 芯片型号，例如GT200、GK210、GM104、GF104， K80, M40等。
- 其中第二个字母表示架构，如K40 中的K表示Kepler架构,P100中的P表示Pascal架构。

针对GeForce系列，还有2系列，3系列，200系列，400系列等分类，像GeForce GTX 1080 就是10系列。
需要注意的地方有：

注意区分Tesla GPU架构和Tesla系列。前者已经用的不是很多了，而后者是最近才出的针对深度学习的系列，使用很多，像我们实验室用的K20,K80都是这个系列。

### 命名
描述一个显卡的时候，一般是`系列名+芯片型号`，如 `Tesla K80`。

针对GeForce系列，芯片型号一般是`显卡型号+具体编号`的形式，如 GeForce GT 705,其中GT 是显卡型号。

最近新出了一款 TiTan X, 主要要和GeForce GTX Tian X 区分。


| 设备                         | 算力 |        | 备注           |
| ---------------------------- | ---- | ------ | -------------- |
| NVIDIA Tesla K40             | 5    | TFLOPS |                |
| NVIDIA Tesla K80             | 8.74 | TFLOPS | Colab          |
| NVIDIA GeForce GTX Titan X   | 7    | TFLOPS |                |
| NVIDIA Tesla P100 PCIe 16 GB | 9.3  | TFLOPS | Kaggle         |
| NVIDIA Tesla V100 PCIe 16 GB | 14.1 | TFLOPS | 百度 AI Studio |
| NVIDIA Tesla T4              | 260  | TFLOPS |                |
| Google Colab Cloud TPU       | 180  | TFLOPs |                |

# 2. GPU监测工具
## 2.1. nvidia-smi

nvidia-smi 简称NVSMI，提供监控GPU使用情况和更改GPU状态的功能，是一个跨平台工具，它支持所有标准的NVIDIA驱动程序支持的Linux发行版以及从WindowsServer 2008 R2开始的64位的系统。

**该工具是N卡驱动附带的，只要安装好驱动后就会有它。**

```
nvidia-smi
>>>
Fri Sep 27 09:14:07 2019 
+-----------------------------------------------------------------------------+ 
| NVIDIA-SMI 418.67 Driver Version: 418.67 CUDA Version: 10.1 | 
|-------------------------------+----------------------+----------------------+ 
| GPU Name Persistence-M| Bus-Id Disp.A | Volatile Uncorr. ECC | 
| Fan Temp Perf Pwr:Usage/Cap| Memory-Usage | GPU-Util Compute M. |
|===============================+======================+======================| 
| 0 Tesla K80 Off | 00000000:00:04.0 Off | 0 | 
| N/A 35C P8 26W / 149W | 0MiB / 11441MiB | 0% Default | 
+-------------------------------+----------------------+----------------------+ +-----------------------------------------------------------------------------+ 
| Processes: GPU Memory |
| GPU PID Type Process name Usage |
|=============================================================================|
| No running processes found |
 +-----------------------------------------------------------------------------+

```

![](/attach/images/2020-02-06-12-32-54.png)

| 名称              | 解释                                                                                                     |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| GPU               | GPU 编号；                                                                                               |
| Name              | GPU 型号                                                                                                 |
| Persistence-M     | 持续模式的状态。持续模式虽然耗能大，但是在新的GPU应用启动时，花费的时间更少，这里显示的是off的状态；     |
| Fan               | 风扇转速，从0到100%之间变动；                                                                            |
| Temp              | 温度，单位是摄氏度；                                                                                     |
| Perf              | 性能状态，从P0到P12，P0表示最大性能，P12表示状态最小性能（即 GPU 未工作时为P0，达到最大工作限度时为P12） |
| Pwr               | Usage/Cap：能耗；                                                                                        |
| Memory Usage      | 显存使用率；                                                                                             |
| Bus-Id            | 涉及GPU总线的东西，domain:bus:device.function；                                                          |
| Disp.A            | Display Active，表示GPU的显示是否初始化；                                                                |
| Volatile GPU-Util | 浮动的GPU利用率；                                                                                        |
| Uncorr. ECC       | Error Correcting Code，错误检查与纠正；                                                                  |
| Compute M         | compute mode，计算模式。                                                                                 |

## 2.2. gpustat

`gpustat`: 基于nvidia-smi的监控GPU 小工具
```shell
# 安装
pip install gpustat
#使用
watch --color -n1 gpustat -cpu 
>>>
```
![](/attach/images/2020-02-06-12-18-17.png)



# 3. CUDA
1. 什么是CUDA
CUDA（Compute Unified Device Architecture），是显卡厂商NVIDIA推出的运算平台。 CUDA™是一种由NVIDIA推出的通用并行计算架构，该架构使GPU能够解决复杂的计算问题。 Cuda 基于GPU驱动

2. 什么是CUDNN
NVIDIA cuDNN是用于深度神经网络的GPU加速库。它强调性能、易用性和低内存开销。NVIDIA cuDNN可以集成到更高级别的机器学习框架中，如谷歌的Tensorflow、加州大学伯克利分校的流行caffe软件。简单的插入式设计可以让开发人员专注于设计和实现神经网络模型，而不是简单调整性能，同时还可以在GPU上实现高性能现代并行计算。
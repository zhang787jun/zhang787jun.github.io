---
title: "Python--高性能编程"
layout: page
date: 2099-06-02 00:00
---
[TOC]

[电子书：Python高性能编程](https://readbook.readthedocs.io/zh_CN/readbook/book/Python%E9%AB%98%E6%80%A7%E8%83%BD%E7%BC%96%E7%A8%8B.html)





第1章　理解高性能Python　1
第2章　通过性能分析找到瓶颈　15
第3章　列表和元组　58
第4章　字典和集合　69
第5章　迭代器和生成器　84
第6章　矩阵和矢量计算　94
第7章　编译成C　126
第8章　并发　171
第9章　multiprocessing模块　193
第10章　集群和工作队列　251
第11章　使用更少的RAM　273
第12章　现场教训　311


密集型任务
I/O 密集型：异步编程
Gevent
Tornado
Asyncio
CPU 密集型：多核 CPU 进行多进程
Multiprocessing
multiprocessing.Pool
内存共享
multiprocessing.Manager()
redis等中间件
mmap


迭代器、生成器
节约内存
延迟估值

# 列表

列表
当我们要将一串长度固定的数子放入列表中，有两种方法：

```python
# 方法一
def method1():
	a = []
	for i in range(100):
		a.append(i)
		
# 方法二
def method2():
	a = [0] * 100
	for i in range(100):
		a[i] = 100
```
当列表的长度较大时，方法二较方法一有明显的性能优势，原因在于方法一的列表需要不断的动态扩张和重新分配内存空间，关于动态表扩张和收缩的策略，可以看《算法导论》第17章第4节。


Python为什么慢
在进行代码的性能优化之前，我们先简单分析Python性能较低的原因

过于强大的动态
Python是一个非常动态的语言，而这使得为Python提供JIT(Just in Time Compiler)异常困难。更加具体的内容可以阅读这篇文章why is python slow

内存分布不紧凑
由于python数据内存分布不紧凑，导致没有很好的利用L1/L2 缓存进行加速。

由于硬件技术的限制，我们可以制造出容量很小但很快的存储器，也可以制造出容量很大但很慢的存储器，但不可能两边的好处都占着，不可能制造出访问速度又快容量又大的存储器。因此，现代计算机都把存储器分成若干级，称为Memory Hierarchy，按照离CPU由近到远的顺序依次是CPU寄存器、Cache、内存、硬盘，越靠近CPU的存储器容量越小但访问速度越快。



大多数程序的行为都具有局部性（Locality）的特点：它们会花费大量的时间反复执行一小段代码（例如循环），或者反复访问一个很小的地址范围中的数据（例如访问一个数组）。所以预读缓存可以有效的提高程序的运行效率：CPU取一条指令，我把和它相邻的指令也都缓存起来，CPU很可能马上就会取到；CPU访问一个数据，我把和它相邻的数据也都缓存起来，CPU很可能马上就会访问到。

但由于python的数据缺乏局部性的特点，导致于都缓存的失效，以下显示了一个列表内部元素的地址分布情况
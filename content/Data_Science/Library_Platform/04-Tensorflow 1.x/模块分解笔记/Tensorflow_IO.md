---
title: "Tensorflow IO 问题"
date: 2019-06-12 00:00
render: True 
tag: Tensorflow,框架,AI,
---
[TOC]
# 1. Tensorflow 的 I/O 问题

## 1.1. 数据I/O操作方法
Tensorflow把数据输送到计算图的过程中，在内存里的数据结构形式主要有三种：

### 1.1.1. Constant 转换为常量存在图中
#### 1.1.1.1. 描述
把Dataset中的数据以const的形式存放在tensorflow的计算图中，主要使用的是tf.constant 函数。	 

#### 1.1.1.2. 优劣及适用情景
这种形式主要适用于小数据集，由于数据固化到了计算图中，所以它的数据读取速度是最快的。
### 1.1.2. Feeding 自建 DataProvider 喂给图
#### 1.1.2.1. 描述

磁盘数据->独立内存空间1->计算图

在每次session.run 时，把numpy形式的数据输入到feed_dict参数中。这种方式主要包括两种存在的状态。
1. **全部加载到内存**。自己维护一个DataProvider 类，每次都会获取一部分训练数据。需要注意的是training的时候最好把数据集shuffle，test的时最好不shuffle。

2. **分批加载到内存**。训练数据无法一次性全部load到内存中时，分批次load数据。自己维护的DataProvider 类要做好队列的管理。这种形式一个小的trick是每次载入的数据使用多次进行训练，这样可以减少重复地读取数据。

#### 1.1.2.2. 优劣及适用情景

**优点：**
1. 当数据集较小的时候，数据可以全部载入到内存，这时数据的处理速度就会比较快。
2. 训练和测试几乎可以共用一套代码，仅需要把反馈网络去掉，不使用参数更新即可。
3. 在预测的时候，一般数据不会是文件的形式，所以只能使用feeding方式。

**缺点：**
1. 自己维护DataProvider类相对麻烦，而且自己写的类原生是不支持多进程的（主要是Python API的问题）
2. 单进程读取数据较慢，很多时间花费在数据读取上，所以训练时间相对较长。

#### 1.1.2.3. 表现形式

以字典{tensor:value}的形式将数据传入到图中，构成feed_dict 系统。
```python 
import tensorflow as tf
x = tf.placeholder(dtype=tf.float32, shape=None)
y=tf.add(x,2.0)
with tf.Session() as sess:
    _y = sess.run(y,feed_dict={x:1.2})
```


### 1.1.3. Queue 使用队列多线程输入到图中

磁盘数据->导入队列的内存空间->队列的内存空间导出->计算图

#### 1.1.3.1. 描述




使用Queue Runner形式从文件中读取。tensorflow以一种黑箱的方式读取数据,必要的时候会启动多进程（需要设置，这些代码是用c++封装的，多线程支持的效果比较好）。

队列运行器QueueRunner需要2个东西：
1. 队列
2. 一些队列操作器((you can have multiple enqueue operations for one queue))

支持：

1. FIFOQueue: A queue implementation that dequeues elements in first-in first-out order.

2. PaddingFIFOQueue: A FIFOQueue that supports batching variable-sized tensors by padding.

3. PriorityQueue: A queue implementation that dequeues elements in prioritized order.

4. QueueBase: Base class for queue implementations.

5. RandomShuffleQueue: A queue implementation that dequeues elements in a random order.


#### 1.1.3.2. 优劣及适用情景


1. Python不支持多线程（伪多线程，虽可以启用multi-thread，但所有启用线程的处理能力加起来等于一个核的处理能力）
2. Python多进程如果是任务可分，不用和主线程交互的情况下是可用的，但对于tensorflow的训练来说，肯定需要使用多（线程、进程）与主（线程、进程）交互。

所以在数据I/O阶段使用python 解释器对磁盘文件进行操作会影响性能
**优势**


1. Tensorflow使用黑箱的方式为数据的解析提供支持，相比于自己写multi-process然后共享变量来说在代码实现上更加友好。
2. python 写的 Tensorflow 程序在运行阶段是调用底层c++运行，更具有I/O 效率

**劣势** 

过于繁琐 目前推荐 `tf.data`  更高级别的封装


#### 1.1.3.3. 表现形式

一句话概括就是：
1. 构建图阶段: 创建队列Queue 和队列执行器QueueRunner
2. 执行图阶段：tf.train.start_queue_runners() 开始填充队列
3. tf.train.Coordinator() 在线程出错时关闭之。

```python
#-*- coding:utf-8 -*-  
import tensorflow as tf  
  
#创建的图:

# 构建一个size=3的先入先出队列q
q = tf.FIFOQueue(3, "float")  
# 入队操作  
enqueue_op = q.enqueue_many(([0.1, 0.2, 0.3],)) 
# 出列 
x = q.dequeue()  
y = x + 1  
q_inc = q.enqueue([y])  
  
#开启一个session,session是会话,会话的潜在含义是状态保持,各种tensor的状态保持  
with tf.Session() as sess:  
        sess.run(enqueue_op)  
  
        for i in range(2):  
                sess.run(q_inc)  
  
        quelen =  sess.run(q.size())  
        for i in range(quelen):  
                print (sess.run(q.dequeue())) 
```

```
def read_example(filename_queue):
    """Read one example from filename_queue"""
    reader = tf.TFRecordReader()
    key, value = reader.read(filename_queue)
    features = tf.parse_single_example(value, features={"image": tf.FixedLenFeature([], tf.string),
                                                        "label": tf.FixedLenFeature([], tf.int64)})
    image = tf.decode_raw(features["image"], tf.uint8)
    image = tf.reshape(image, [28, 28])
    label = tf.cast(features["label"], tf.int32)
    return image, label

if __name__ == "__main__":
    queue = tf.train.string_input_producer(["TFRecords/train.tfrecords"], num_epochs=10)
    image, label = read_example(queue)

    img_batch, label_batch = tf.train.shuffle_batch([image, label], batch_size=32, capacity=5000,
                                                    min_after_dequeue=2000, num_threads=4)
    with tf.Session() as sess:
        sess.run(tf.local_variables_initializer())
        sess.run(tf.global_variables_initializer())

        coord = tf.train.Coordinator()
        threads = tf.train.start_queue_runners(sess=sess, coord=coord)

        try:
            while not coord.should_stop():
                # Run training steps or whatever
                images, labels = sess.run([img_batch, label_batch])
                print(images.shape, labels.shape)

        except tf.errors.OutOfRangeError:
            print('Done training -- epoch limit reached')

        coord.request_stop()
        coord.join(threads)
```

## 1.2. I/O数据的存储格式
### 1.2.1. Protocol Buffer

Protocol Buffers 是谷歌开放的一种轻便高效的结构化数据存储格式
特性：
1. 处理结构化数据的工具
2. 二进制流
3. 需要先定义数据格式（schema）,才能还原
4. 序列化数据比xml 小3~10倍，解析快20~100倍
5. 文件格式 `.proto`
6. 每一个message代表了一类结构体和的数据

### 1.2.2. json

## 1.3. TFRecord 格式的数据及其I/O操作

#### 1.3.1. TFRecord 是什么？
>TFRecord 是谷歌推荐的一种二进制`文件格式`，理论上它可以保存任何格式的信息。

TFRecord文件将数据存储为 <**二进制**> <**字符串**> <**序列**> .

将数据写入TFRecord文件之**前**需要**指定数据的结构**，
Tensorflow为此提供了两个组件：tf.train.Example 和 tf.train.SequenceExample。必须将每个数据样本存储在其中一个组件中，然后对其进行序列化并使用tf.python_io.TFRecordWriter把它写到磁盘上。



#### 1.3.2. 什么情景下使用推荐

从磁盘提取**大量小文件**会显著影响 I/O 性能。推荐的实现最大 I/O 吞吐量的一种方法是将输入数据预处理为更大（约 100MB）的 TFRecord 文件。
1. 对于较小的数据集 (200MB-1GB)，最好的方法通常是将整个数据集加载到内存中
2. 对于较大的数据集。 将输入数据预处理为更大（约 100MB）的 TFRecord 文件。 


#### 1.3.3. TFRecord 核心--Example
TFRecord文件本身是 <**二进制**> <**字符串**> <**序列**>，还原数据原本面目的**核心在于说明数据的结构**
##### 1.3.3.1. 参数说明

```python
tf.train.Example(features:tf.train.Features=xxx)
 |__tf.train.Features(feature:dict=feature_dict)
   |__feature_dict={key:value}
      |__ value:string
      |__ key:tf.train.Feature(Int64List=int_a) 
          |__int_a:tf.train.BytesList(value=[])
```


tf.train.Example 是protocol buffer  协议下的**消息体(message)**,不是普通的python类
一个 Example **消息体**包含了 **一系列的feature 属性**
```python
example=tf.train.Example(features=_features)
>>>type(_features) 
tf.train.Features
```
tf.train.Features是命名特征的集合。它有一个形参 feature ，类型为一个字典，其中key是特征的名称，value是tf.train.Feature
```python
_features=tf.train.Features(feature=feature_dict)
>>> type(feature_dict)
dict
```

```python
feature_dict = {key:value,}
>>>type(key)
string
>>>type(value)
tf.train.Feature  ## 注意没有s

tf.train.Feature(Int64List:tf.train.BytesList=None,FloatList:tf.train.FloatList=None, BytesList:tf.train.Int64List=None)

value=tf.train.Feature(Int64List=int_a)
value=tf.train.Feature(FloatList=float_b)
value=tf.train.Feature(BytesList=bytes_c)

>>>type(int_a)
tf.train.BytesList
>>>type(float_b)
tf.train.FloatList
>>>type(bytes_c)
tf.train.Int64List

tf.train.BytesList(value:list=[])
tf.train.FloatList(value:list=[])
tf.train.Int64List(value:list=[])

tf.train.BytesList(value:list=[b"hello world"])
tf.train.FloatList(value:list=[0.1,0.2])
tf.train.Int64List(value:list=[1,2,3,4])

```
##### 1.3.3.2. 方法说明

tf.train.Example和tf.train.SequenceExample提供SerializeToString方法,进行结构化数据首先需要序列化

```python
example.SerializeToString()

```
#### 1.3.4. 存储为 TFrecord格式文件
```python
tf.python_io.TFRecordWriter(path=None)

float_list=tf.train.Int64List(value:list=[1,2,3,4])
feature_value=tf.train.Feature(FloatList=float_list)
feature_dict={"feature_key",feature_value}
features=tf.train.Features(feature:dict=feature_dict)
example=tf.train.Example(features:tf.train.Features=features)

with tf.python_io.TFRecordWriter('customer_1.tfrecord') as writer:
    writer.write(example.SerializeToString())
```
#### 1.3.5. 使用tf.data将TFrecord格式文件输入到tensorflow图中
##### 1.3.5.1. 导入
从多个tfrecord文件中导入数据到Dataset类
```python 
filenames = ["test.tfrecord", "test2.tfrecord"]
dataset = tf.data.TFRecordDataset(filenames)
```
##### 1.3.5.2. 序列化样本解析
tfrecord文件是序列化样本，所以我们需要对每一个样本进行解析。 具体实现 通过dataset 的map方法，map 解析函数，如下：
```python
dataset=dataset.map(parse_function)
# parse_function 解析函数
```


###### 1.3.5.2.1. parse_function 解析函数

**1. 输入输出**
输入：example_proto  也就是序列化后的样本tf_serialized
输出： parsed_example 

```python
def parse_function(example_proto):
    # 只接受一个形参：example_proto，也就是序列化后的样本tf_serialized
    parsed_example = tf.parse_single_example(example_proto, feature_dicts)
    # feature_dicts 解析字典---feature的解析方式
    # feature_dicts={key:value}  key为feature名，value为feature的解析方式

    # 返回所有feature
    return parsed_example
```
**2. feature_dicts 解析字典**
feature_dicts={key:value}  key为feature名，value为feature的解析方式


**3. feature的解析方式**

feature的解析方式:

| 编号 | 解析方式       |
| ---: | :------------- |
|    1 | 定长特征解析   |
|    2 | 不定长特征解析 |

1. 定长特征解析：`tf.FixedLenFeature(shape, dtype, default_value)`
```python
tf.FixedLenFeature(shape:tuple=(1,2), dtype=tf.float32, default_value=None)
```
|          形参 | 备注                                                                                                            |
| ------------: | :-------------------------------------------------------------------------------------------------------------- |
|         shape | 1. 可当reshape来用，如vector的shape从(3,)改动成了(1,3)。<br>2. 如果写入的feature使用了.tostring() 其shape就是() |
|         dtype | 必须是tf.float32， tf.int64， tf.string中的一种。                                                               |
| default_value | feature值缺失时所指定的值。                                                                                     |

注：


2. 不定长特征解析：`tf.VarLenFeature(dtype)`
```python
tf.VarLenFeature(dtype)
#注：可以不明确指定shape，但得到的tensor是SparseTensor。
```
**4. 特殊 feature的 转变特征**


得到的parsed_example也是一个字典，其中每个key是对应feature的名字，value是相应的feature解析值。如果使用了下面两种情况，则还需要对这些值进行转变。其他情况则不用。

string类型：tf.decode_raw(parsed_feature, type) 来解码
注：这里type必须要和当初.tostring()化前的一致。如tensor转变前是tf.uint8，这里就需是tf.uint8；转变前是tf.float32，则tf.float32

VarLen解析：由于得到的是SparseTensor，所以视情况需要用tf.sparse_tensor_to_dense(SparseTensor)来转变成DenseTensor
```python
# 解码字符
parsed_example['tensor'] = tf.decode_raw(parsed_example['tensor'], tf.uint8)
# 稀疏表示 转为 密集表示
parsed_example['matrix'] = tf.sparse_tensor_to_dense(parsed_example['matrix'])
```
**5. 改变形状**
到此为止得到的特征都是向量，需要根据之前存储的shape信息对每个feature进行reshape。
```python

# 转变matrix形状
parsed_example['matrix'] = tf.reshape(parsed_example['matrix'], parsed_example['matrix_shape'])
    
# 转变tensor形状
parsed_example['tensor'] = tf.reshape(parsed_example['tensor'], parsed_example['tensor_shape'])
```

2.1.3. 执行解析函数

创建好解析函数后，将创建的parse_function送入dataset.map()得到新的数据集

new_dataset = dataset.map(parse_function)
##### 1.3.5.3. 创建迭代器
后续与其他dataset 处理一致
iterator = dataset.make_one_shot_iterator()


## 1.4. parse_example
```python
tf.io.parse_example(
    serialized,
    features_spec,
    example_names=None,
    name=None
)
tf.io.parse_example()
tf.parse_example()

# serialized:一个batch的序列化的example 
# features_spec:解析example的规则 
# name：当前操作的名字 
# example_name:当前解析example的proto名称

```


这里重点要说的是第二个参数，也就是features，features是把serialized的example中按照键值映射到三种tensor: 1,VarlenFeature 2, SparseFeature 3,FixedLenFeature 
下面对这三种映射方式做一个简要的叙述：

VarlenFeature

是按照键值把example的value映射到SpareTensor对象，假设我们有如下的serialized数据：

 serialized = [
    features
      { feature { key: "ft" value { float_list { value: [1.0, 2.0] } } } },
    features
      { feature []},
    features
      { feature { key: "ft" value { float_list { value: [3.0] } } }
  ]

使用VarLenFeatures方法：

features={
    "ft":tf.VarLenFeature(tf.float32)
}
1
2
3
那么我们将得到的是：

{"ft": SparseTensor(indices=[[0, 0], [0, 1], [2, 0]],
                      values=[1.0, 2.0, 3.0],
                      dense_shape=(3, 2)) }
1
2
3
可见，显示的indices是ft值的索引，values是值，dense_shape是indices的shape

FixedLenFeature

而FixedLenFeature是按照键值对将features映射到大小为[serilized.size(),df.shape]的矩阵，这里的FixLenFeature指的是每个键值对应的feature的size是一样的。对于上面的例子，如果使用：

features: {
      "ft": FixedLenFeature([2], dtype=tf.float32, default_value=-1),
  }

那么我们将得到：

{"ft": [[1.0, 2.0], [3.0, -1.0]]}
1
可见返回的值是一个[2,2]的矩阵，如果返回的长度不足给定的长度，那么将会使用默认值去填充。 
## 1.5. tf.gfile

tensorflow gfile文件操作详解

翻译过来就是 **无线程锁的文件I/O操作包装器**

1. 提供了一种类似于python文件 I/O操作的API；
2. 提供了一种操作tensorflow C++文件系统的API；
3. tensorflow c++文件操作接口支持多个文件系统实现，包括本地文件、谷歌云存储(以gs://开头)和HDFS(以HDFS://开头)，tensorflow封装这些接口到tf.gfile，以便我们可以使用这些接口来存储和加载检查点文件、将tensorboard log信息写到文本里以及访问训练数据(在其他用途里)。但是，如果所有文件都放在本地，那么我们直接使用python提供的常规文本操作接口也是一样效果且毫无问题的

https://zhuanlan.zhihu.com/p/31536538
## 1.6. 队列进阶


```python

def read_and_decode(filename):
    #根据文件名生成一个队列
    filename_queue = tf.train.string_input_producer([filename])

    reader = tf.TFRecordReader()
    _, serialized_example = reader.read(filename_queue)   #返回文件名和文件
    features = tf.parse_single_example(serialized_example,
                                       features={
                                           'label': tf.FixedLenFeature([], tf.int64),
                                           'img_raw' : tf.FixedLenFeature([], tf.string),
                                       })

    img = tf.decode_raw(features['img_raw'], tf.uint8)
    img = tf.reshape(img, [224, 224, 3])
    img = tf.cast(img, tf.float32) * (1. / 255) - 0.5
    label = tf.cast(features['label'], tf.int32)

    return img, label
```


```python
coord = tf.train.Coordinator()
threads = tf.train.start_queue_runners(sess=sess, coord=coord)
try:
    while not coord.should_stop():
        # Run training steps or whatever
        sess.run(train_op)
except tf.errors.OutOfRangeError:
    print('Done training -- epoch limit reached')
finally:
    # When done, ask the threads to stop.
    coord.request_stop()
# Wait for threads to finish.
coord.join(threads)
sess.close()
```




##### 利用多进程 I/O 构建流水线

流水线将训练步骤的预处理和模型执行过程重叠到一起。当加速器正在执行第 N 个训练步时，CPU 正在准备第 N+1 步的数据。这样做不仅可以最大限度地缩短训练的单步用时（而不是总用时），而且可以缩短提取和转换数据所需的时间。


![](../../../../../attach/images/2019-10-12-10-07-27.png)

## 多线程认为中的TensorFlow/IO

总结
这两个类是实现TensorFlow pipeline的基础，能够高效地并行处理数据。个人认为在数据较大时，应该避免使用feed_dict。因为，feed_dict是利用python读取数据，python读取数据的时候，tensorflow无法计算，而且会将数据再次拷贝一份。


# 提升I/O性能的方法[^1]

## 硬件上任务分离

### CPU
### GPU

#### 网络
while the CPU is preparing the data, the accelerator is sitting idle. Conversely, while the accelerator is training the model, the CPU is sitting idle. 

The training step time is thus the sum of both CPU pre-processing time and the accelerator training time.



* 首字节时间：与本地存储相比，从远程存储读取文件的首字节所用时间可能要多出几个数量级。

* 读取吞吐量：虽然远程存储通常可提供较大的聚合带宽，但读取单个文件可能只能利用此带宽的一小部分。

### 总结

下面简要介绍了设计输入流水线的最佳做法：

1. 使用 prefetch 转换可将提供方和使用方的工作重叠。我们特别建议将 prefetch(n)（其中 n 是单步训练使用的元素数/批次数）添加到输入流水线的末尾，以便将在 CPU 上执行的转换与在加速器上执行的训练重叠。

2. 通过设置 num_parallel_calls 参数并行处理 map 转换。建议您将其值设为可用 CPU 核的数量 core num。
   
3. 如果您使用 batch 转换将预处理元素组合到一个批次中，建议您使用 map_and_batch 混合转换；特别是在您使用的批次较大时。
   
4. 如果您要处理远程存储的数据并/或需要反序列化，建议您使用 parallel_interleave 转换来重叠从不同文件读取（和反序列化）数据的操作。
   
5. 向量化传递给 map 转换的低开销用户定义函数，以分摊与调度和执行相应函数相关的开销。
   
6. 如果内存可以容纳您的数据，请使用 cache 转换在第一个周期中将数据缓存在内存中，以便后续周期可以避免与读取、解析和转换该数据相关的开销。
   
7. 如果预处理操作会增加数据大小，建议您首先应用 interleave、prefetch 和 shuffle（如果可以）以减少内存使用量。
   
8. 建议您在应用 repeat 转换之前先应用 shuffle 转换，最好使用 shuffle_and_repeat 混合转换。

# 参考文献

[^1]:Better performance with tf.data
https://tensorflow.google.cn/guide/data_performance
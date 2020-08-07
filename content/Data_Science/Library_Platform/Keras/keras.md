---
title: "Keras基础"
layout: page
date: 2099-06-02 00:00
---
[TOC]



# 1. 基本概念

**版本1**
Keras is a high-level neural networks API, written in Python and capable of running on top of Tensorflow, Theano or CNTK. 

**版本2**
Keras is a deep learning API written in Python, running on top of the machine learning platform TensorFlow.

**重点**
1. 是一个API，计算有基础框架执行
2. written in Python


**设计宗旨**
Keras is an API designed for human beings, not machines.



## 1.1. 与 TensorFlow 区别
TensorFlow is a free and open-source software library for data flow and differentiable programming across a range of tasks




# 2. keras backend

# 3. keras.layer

keras 里面的几个基础layer
## 3.1. Dense
Dense就是常用的全连接层。

$$
output = activation(dot(input, kernel)+bias)$$

input shape=(None,n)
output shape=(None,units)

其中activation是逐元素计算的激活函数，kernel是本层的权值矩阵，bias为偏置向量，只有当use_bias=True才会添加。
```python
Dense(units, activation=None, use_bias=True, kernel_initializer='glorot_uniform', bias_initializer='zeros', kernel_regularizer=None, bias_regularizer=None, activity_regularizer=None, kernel_constraint=None, bias_constraint=None)
```

## 3.2. Flatten
用来将输入**压平**，即把多维的输入一维化，常用在从卷积层到全连接层的过渡。Flatten不影响batch的大小。

```shell
input_shape=(None,n,m,x,y,z)
output_shape=(None,n*m*x*y,z)
```

```shell
_________________________________________________________________
lstm_24 (LSTM)               (None, 12, 10)            3000      
_________________________________________________________________
flatten_3 (Flatten)          (None, 120)               0         
_________________________________________________________________
```

## 3.3. Embedding

Embedding层只能作为模型的第一层


```python
keras.layers.embeddings.Embedding(input_dim, output_dim, embeddings_initializer='uniform', embeddings_regularizer=None, activity_regularizer=None, embeddings_constraint=None, mask_zero=False, input_length=None)

```


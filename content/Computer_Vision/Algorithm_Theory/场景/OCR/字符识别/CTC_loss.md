---
title: "CTC loss Function"
layout: page
date: 2099-06-02 00:00
---
[TOC]

# 1. CTC 是什么
CTC 的全称是`Connectionist Temporal Classification`。

# 2. 使用场景?

这个方法主要是解决神经网络label 和output **不对齐的问题**（Alignment problem）。


# 3. 原理
CTC是借鉴了隐马尔科夫模型(Hidden Markov Nodel)的Forward-Backward算法思路，是利用动态规划的思路计算CTC-Loss及其导数的。

## 3.1. Softmax 之后

 

# 4. 关键

## 4.1. CTC Loss
### 4.1.1. 基本步骤
训练神经网络需要计算`loss function` ， 与其他常见的`loss function`不同，计算**CTC loss**需要2步：
1. 计算所有可能的序列组合的概率和
   > We first need to sum over probabilities of all possible alignments of the text present in the image.
2. 取负对数
   > Then take the negative logarithm of this to calculate the loss.
```

```



## 4.2. CTC decoder
在推理阶段，需要 `CTC decoder`从神经网络的输出获得文本。
训练和的 Nw 可以用来预测新的样本输入对应的输出字符串，这涉及到解码。
按照最大似然准则，最优的解码结果为：

$$h(x)=argmax_{l∈L≤T} p(l|x)$$


然而，上式不存在已知的高效解法。下面介绍几种实用的近似破解码方法。


### 4.2.1. 主要解码方法
这里主要有2种分类方法 (decoding method)：
1. `Best path decoding`.  按照正常分类问题， 那就是概率最大的sequence 就是分类器的输出。 这个就是用每一个 time step的输出做最后的结果。 但是这样的方法不能保证一定会找到最大概率的sequence. 
2. `prefix search decoding`.  这个方法据说给定足够的计算资源和时间， 能找到最优解。 但是复杂度会指数增长 随着输入sequence 长度的变化。  这里推荐用有限长度的prefix search decode 来做。 但是具体考虑多长的sequence做判断 还需具体问题具体分析。 这里的理论基础和就是 每一个node  都是condition 在上一个输出的前提下  算出整个序列的概率。

### 4.2.2. 基本步骤
1. 选取每个步长概率最高的字符
   >Takes the characters with the highest probability for each time step.
2. 去重和空白符号
    >Remove the duplicate characters and then remove the blank character from the outputs.

[^1][^2]


# 5. 实践 

## 5.1. Tensorflow
```python
tf.nn.ctc_loss(
    labels,
    inputs,
    sequence_length,
    preprocess_collapse_repeated=False,
    ctc_merge_repeated=True,
    ignore_longer_outputs_than_inputs=False,
    time_major=True
)
```


labels：int32 类型的稀疏向量
inputs：3维的float向量，如果time_major为默认的，那么其形状为[max_time, batch_size, num_classes]，把LSTM输出的第0维和第1维换一下即可。另外，如同TensorFlow源码解读之greedy search及beam search中所讲的那样，输入值是经过logit处理的变量。
sequence_length：是一个int32列表，维度为 batch_size，里面每个值的大小为系列的长度。


# 6. 参考资料

[^1]: Connectionist Temporal Classification - Labeling Unsegmented Sequence Data with Recurrent Neural Networks: Graves et al., 2006 [(pdf)](http://www.cs.toronto.edu/~graves/icml_2006.pdf)

[^2]: https://theailearner.com/2019/05/29/connectionist-temporal-classificationctc/

[^2]: [CSDN: CTC 原理及实现](https://blog.csdn.net/JackyTintin/article/details/79425866)



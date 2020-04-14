---
title: "Tensorflow数据可视化工具--TensorFlow Data Validation
"
date: 2019-06-12 00:00
render: True 
tag: Tensorflow,框架,AI,
---

[TOC]

# 安装
## pip
```shell
pip install tensorflow-data-validation
```

# 基本使用


1. 生成统计数据 
```python
import tensorflow_data_validation as tfdv


# 1. 从tfrecord 获得 
stats = tfdv.generate_statistics_from_tfrecord(data_location=path)

# 2. 从dataframe 获得
## 默认n_jobs =1 ,可以根据系统的cores of cpus 更改
stats = tfdv.generate_statistics_from_dataframe(df,n_jobs)

# 3. 从csv获得
stats = tfdv.generate_statistics_from_csv(data_location=path)

# 最佳实践 


import multiprocessing
cores_of_cpus=multiprocessing.cpu_count()
stats = tfdv.generate_statistics_from_dataframe(df,n_jobs=cores_of_cpus)

```


2. 统计数据的可视化 

```python
tfdv.visualize_statistics(stats1,stats2,"stats1_name","stats2_name")
```
3. 生成数据模式 
数据模式内容包括：
    1. 数据类型
    2. 每个样本的特征数量
```yml
feature {
  name: "payment_type"
  value_count {
    min: 1
    max: 1
  }
  type: BYTES
  domain: "payment_type"
  presence {
    min_fraction: 1.0
    min_count: 1
  }
}
```


```python
schema = tfdv.infer_schema(statistics=train_stats)
tfdv.display_schema(schema=schema)
```

# 使用docker

```shell
# win10 
docker run --rm -d -p 8888:8888/tcp  -v <full-file-path>:/notebooks registry.cn-zhangjiakou.aliyuncs.com/zjlbzf_docker/tfdv:latest

# Linux
docker run --rm -d -p 8888:8888/tcp  -v .:/notebooks registry.cn-zhangjiakou.aliyuncs.com/zjlbzf_docker/tfdv:latest
```



# 参考资料
https://tensorflow.google.cn/tfx/guide/tfdv#drift_detection_tfdv_drift_detection


 
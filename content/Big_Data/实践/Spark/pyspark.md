---
title: "pyspark sql 编程 "
layout: page
date: 2099-06-02 00:00
---

[TOC]
Spark SQL是用来处理结构化数据的模块。与基本RDD相比，Spark SQL提供了更多关于数据结构和计算方面的信息(在内部有优化效果)。通常通过SQL和Dataset API来和Spark SQL进行交互。

SQL: 进行SQL查询，从各种结构化数据源(Json, Hive, Parquet)读取数据。返回Dataset/DataFrame。
Dataset: 分布式的数据集合。
DataFrame
是一个组织有列名的Dataset。类似于关系型数据库中的表。
可以使用结构化数据文件、Hive表、外部数据库、RDD等创建。
在Scala和Java中，DataFrame由Rows和Dataset组成。在Scala中，DataFrame只是Dataset[Row]的类型别名。在Java中，用Dataset表示DataFrame


# 初始化Spark 任务
```python
from pyspark.sql import SparkSession

spark = SparkSession \
    .builder \
    .appName("Python Spark SQL basic example") \
    .config("spark.some.config.option", "some-value") \
    .getOrCreate()
```

# 创建Dataframe
## 从内存创建

内存数据->RDD->DataFrame
```python
# 1. 从list创建
# list->pair_RDDs->DataFrame
person_list = [('AA', 18), ('PLM', 23)]
rdd = sc.parallelize(person_list)	

df = spark.createDataFrame(person_list) # 没有指定列名，默认为_1 _2
df = spark.createDataFrame(person_list, ['name', 'age']) # 指定了列名
df.collect() # df.show()
#[Row(name='AA', age=18), Row(name='PLM', age=23)]

# 2. 从RDD创建
rdd = sc.parallelize(person_list)
df = spark.createDataFrame(rdd, ['name', 'age'])

# 2.2 Row
from pyspark.sql import Row
Person = Row('name', 'age')					# 指定模板属性
persons = rdd.map(lambda r: Person(*r))		# 把每一行变成Person
df = spark.createDataFrame(persons)
df.collect()

# 2.3 指定类型StructType
from pyspark.sql.types import *
field_name = StructField('name', StringType(), True) # 名，类型，非空
field_age = StructField('age', IntegerType, True)
person_type = StructType([field_name, field_age])
# 通过链式add也可以
# person_type = StructType.add("name", StringType(), True).add(...)
df = spark.createDataFrame(rdd, person_type)

```

## 从外部读取

```python
#---[1]- read 文件
# 1. json 键值对
df1 = spark.read.json("python/test_support/sql/people.json")
df1.dtypes
# [('age', 'bigint'), ('name', 'string')]
df2 = sc.textFile("python/test_support/sql/people.json")
# df1.dtypes 和 df2.dtypes是一样的

# 2. text 文本文件 
# 每一行就是一个Row，默认的列名是Value
df = spark.read.text("python/test_support/sql/text-test.txt")
df.collect()
# [Row(value=u'hello'), Row(value=u'this')]


#---[2]- load 数据源

# 3. load
# 从数据源中读取数据
df2 = spark.read.load("people.json", format="json")
df3 = spark.read.load("users.parquet")
```

# 查看Dataframe
```python
df.dtypes #Return df column names and data types
df.show() #Display the content of df
df.head() #Return first n rows
df.first() #Return first row
df.take(2) #Return the first n rows 
df.schema 
```

# 操作Dataframe
参考 https://s3.amazonaws.com/assets.datacamp.com/blog_assets/PySpark_SQL_Cheat_Sheet_Python.pdf


```python
df.printSchema()
df.select("name").show()
df.select(df['name'], df['age'] + 1).show()
df.filter(df['age'] > 21).show()
df.groupBy("age").count().show()

df = df.dropDuplicates() # 去重 

# 删除
df = df.drop("address", "phoneNumber")
df = df.drop(df.address).drop(df.phoneNumber)
```
---
title: "openssh 在windows 上的实践"
layout: page
date: 2099-06-02 00:00
---
[TOC]

Installation of OpenSSH For Windows Server 2019 and Windows 10

# openssl 实践 
`PKCS `全称是 Public-Key Cryptography Standards ，是由 RSA 实验室与其它安全系统开发商为促进公钥密码的发展而制订的一系列标准，PKCS 目前共发布过 15 个标准。 常用的有：
1. `PKCS#7` Cryptographic Message Syntax Standard
2. `PKCS#10` Certification Request Standard
3. `PKCS#12` Personal Information Exchange Syntax Standard

X.509是常见通用的证书格式。所有的证书都符合为Public Key Infrastructure (PKI) 制定的 ITU-T X509 国际标准。
PKCS#7 常用的后缀是： .P7B .P7C .SPC
PKCS#12 常用的后缀有： .P12 .PFX
X.509 DER 编码(ASCII)的后缀是： .DER .CER .CRT
X.509 PAM 编码(Base64)的后缀是： .PEM .CER .CRT
.cer/.crt是用于存放证书，它是2进制形式存放的，不含私钥。
.pem跟crt/cer的区别是它以Ascii来表示。
pfx/p12用于存放个人证书/私钥，他通常包含保护密码，2进制方式
p10是证书请求
p7r是CA对证书请求的回复，只用于导入
p7b以树状展示证书链(certificate chain)，同时也支持单个证书，不含私钥。
—————-
注：
der,cer文件一般是二进制格式的，只放证书，不含私钥
crt文件可能是二进制的，也可能是文本格式的，应该以文本格式居多，功能同der/cer
pem文件一般是文本格式的，可以放证书或者私钥，或者两者都有
pem如果只含私钥的话，一般用.key扩展名，而且可以有密码保护
pfx,p12文件是二进制格式，同时含私钥和证书，通常有保护密码
怎么判断是文本格式还是二进制？用记事本打开，如果是规则的数字字母，如

—–BEGIN CERTIFICATE—–
MIIE9jCCA96gAwIBAgIQVXD9d9wgivhJM//a3VIcDjANBgkqhkiG9w0BAQUFADBy
—–END CERTIFICATE—–

就是文本的，上面的BEGIN CERTIFICATE，说明这是一个证书
如果是—–BEGIN RSA PRIVATE KEY—–，说明这是一个私钥
文本格式的私钥，也可能有密码保护
文本格式怎么变成二进制？ 从程序角度来说，去掉前后的—-行，剩下的去掉回车，用base64解码，就得到二进制了
不过一般都用命令行openssl完成这个工作。
—————

## 创建CA证书的RSA密钥：
```
# PEM格式
openssl genrsa -des3 -out ca.key 1024
```

## 创建CA证书



```shell
# (PEM格式,假如有效期为一年)：
openssl req -new -x509 -days 365 -key ca.key -out ca.crt -config openssl.cnf

# req的基本功能主要有两个：
# 1. 生成证书请求
# 2. 生成自签名证书。
# 其他还有一些校验、查看请求文件等功能，示例会简单说明下。参数说明如下

# -new  要生成证书请求
# -x509 要生成自签名证书
# -days 有效期
```

openssl是可以生成DER格式的CA证书的，最好用IE将PEM格式的CA证书转换成DER格式的CA证书。



## 什么是 CSR？
CSR 即证书签名申请（Certificate Signing Request），获取 SSL 证书，需要先生成 CSR 文件并提交给证书颁发机构（CA）。CSR 包含了公钥和标识名称（Distinguished Name），通常从 Web 服务器生成 CSR，同时创建加解密的公钥私钥对。

在创建 CSR 过程中，需要提供相关组织机构信息，web 服务器会根据提供的信息创建证书的标识名称，用来识别证书，内容如下：

国家或地区代码
您的组织机构依法注册所在的国家或地区的代码，以国际标准化组织（ISO）的两字母格式表示。

省或市或自治区
您的组织机构所在的省或市或自治区。

城市或地区
您的组织机构注册或所在的城市或地区。

组织机构
您的企业依法注册所用的名称。

组织机构单位
此字段用于区分组织机构中的各部门，例如 “工程部” 或 “人力资源部”。

通用名称
在 CSR 的通用名称字段中输入的名称必须是您要为其使用证书的网站的完全限定域名（FQDN），例如 “www.domainnamegoeshere”。

但是腾讯云采用了在线生成 CSR 的方式，无需您生成和提交 CSR 文件，域名型证书仅需要提交通用名称即可申请，帮助您简化申请流程。

### config file

编辑 config file 



三 x509到pfx
```shell
pkcs12 -export –in keys/client1.crt -inkey keys/client1.key -out keys/client1.pfx
```
四 PEM格式的ca.key转换为Microsoft可以识别的pvk格式。
```shell
pvk -in ca.key -out ca.pvk -nocrypt -topvk

```
五 PKCS#12 到 PEM 的转换
```shell
openssl pkcs12 -nocerts -nodes -in cert.p12 -out private.pem
```
验证 openssl pkcs12 -clcerts -nokeys -in cert.p12 -out cert.pem
六 从 PFX 格式文件中提取私钥格式文件 (.key)
```shell
openssl pkcs12 -in mycert.pfx -nocerts -nodes -out mycert.key
```
七 转换 pem 到到 spc
```shell
openssl crl2pkcs7 -nocrl -certfile venus.pem -outform DER -out venus.spc
```
用 -outform -inform 指定 DER 还是 PAM 格式。例如：
```
openssl x509 -in Cert.pem -inform PEM -out cert.der -outform DER

```
八 PEM 到 PKCS#12 的转换
```
openssl pkcs12 -export -in Cert.pem -out Cert.p12 -inkey key.pem
```

## ssh 掉线的问题 






```shell
vim /etc/ssh/sshd_config

>>>
# 找到ClientAliveInterval和ClientAliveCountMax ，去掉注释并修改
ClientAliveInterval 30
ClientAliveCountMax 86400

service sshd restart
```


# 给服务器添加公钥

```shell
# 方案1
ssh-copy-id -i id_rsa root@172.28.44.120

# 方案2
scp id_rsa.pub root@xxx.xxx.xxx.xxx:/root
mkdir ~/.ssh                # 如果不存在该文件夹需先创建，若已存在则忽略
cat ~/id_rsa.pub >> ~/.ssh/authorized_keys
rm ~/id_rsa.pub                 # 用完就可以删掉了

```

# 参考资料 

https://docs.microsoft.com/en-us/windows-server/administration/openssh/openssh_install_firstuse
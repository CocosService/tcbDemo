'use strict';
const app = require('tcb-admin-node');
const tcbConfig = { env: 'undefinedenv' }; //当前环境 ENV_ID
const auth = app.init(tcbConfig).auth();

exports.main = async (event, context, callback) => {
  const db = app.database();
  const dbColName = 'info'; //数据库集合名称，可自定义
  const collection = db.collection(dbColName); 

  var result = {
    status: -1,
    err_msg: 'action not exist!'
  };

  if (event.action === 'send') {
    //获取客户端传来的参数，可在云函数中做计算处理
    let a = event.a;

    result = {
      status: 0,
      msg: 'receive data',
      data: a
    }
  }
  else if (event.action === 'getData') {
    try {
      // 与客户端自定义的参数名需要一致，当前event.param.showCount对应显示多少条数据，event.param.sortFiled为排序用字段
      let res = await collection.limit(event.param.showCount).orderBy(event.param.sortFiled, "desc").get();
      //调试正常后 INVALID_ENV 和 DATABASE_COLLECTION_NOT_EXIST 情况不会出现，自己写代码时不一定需要做这两项判断。
      if (res.code && res.code === 'INVALID_ENV') { //出现该情况请检查本文件的 env 环境 ID 是否与当前配置一致
        result = {
          status: -1,
          msg: 'Please check your ENV_ID in CloudFunction File.',
          data: res
        }
      }
      //若该数据集合不存在，先创建该数据集合，也可在此之前手动在TCB后台创建
      else if (res.code === 'DATABASE_COLLECTION_NOT_EXIST') {
        result = {
          status: -1,
          msg: 'Database collection does not exist, add it now.',
          data: res.code
        }
        db.createCollection(dbColName); //通过命令添加该数据集合
      }
      else if (res.data) {
        result = {
          status: 0,
          msg: 'get data func',
          data: res.data,
        }
      }
      else {
        result = {
          status: -1,
          msg: 'error occurred, get data func',
          data: res
        }
      }
    } catch (err) {
      return {
        status: 1,
        msg: 'error occurred, get data func',
        data: err
      }
    }
  }
  else if (event.action === 'submitData') {
    try {
      const user = await collection.where({
        user_id: event.param.user_id
      }).get();
      if (user.code && user.code === 'INVALID_ENV') {
        result = {
          status: -1,
          msg: 'Please check your ENV_ID in CloudFunction File.',
          data: user
        }
      }
      else if (user.code && user.code === 'DATABASE_COLLECTION_NOT_EXIST') {
        result = {
          status: -1,
          msg: 'database collection does not exist, add it now.',
          data: user.code
        }
        db.createCollection(dbColName); //通过命令添加该数据集合
      }
      // 如果有数据，则只是更新，如果没数据则添加该用户
      else if (user.data.length === 0) {
        let res = await collection.add(event.param);
        result = {
          status: 0,
          msg: 'add user ' + event.param.user_id,
          data: res,
        }
      }
      //数据库原先有该id，update成功
      else {
        let res = await collection.where({ user_id: event.param.user_id }).update(event.param);
        result = {
          status: 0,
          msg: 'update user ' + event.param.user_id,
          data: user.data.length
        }
      }
    } catch (err) {
      result = {
        status: -1,
        msg: 'error occurred, user ' + event.param.user_id,
        data: err
      }
    }
  }
  callback(null, result);
}

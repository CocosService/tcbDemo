'use strict';
const app = require('tcb-admin-node');
const tcb_config = { env: 'undefinedenv' };
const auth = app.init(tcb_config).auth();

exports.main = async (event, context, callback) => {
  const db = app.database();
  const collection = db.collection('rank'); // 集合名为rank，可自定义

  var result = {
    status: -1,
    err_msg: 'action not exist!'
  };

  if (event.action === 'send') {
    //获取客户端传来的参数，可在云函数中做处理
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
      //若数据集合rank不存在，先创建rank集合数据库，也可在此之前手动在TCB后台创建
      if (res.code === 'DATABASE_COLLECTION_NOT_EXIST') {
        result = {
          status: -1,
          msg: 'Database collection <rank> does not exist',
          data: res.code
        }
        db.createCollection('rank');
      }
      else
        result = {
          status: 0,
          msg: 'get data func',
          data: res.data
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
      //let res = await collection.where({ user_id: event.param.user_id }).update(event.param);
      if (user.code && user.code === 'DATABASE_COLLECTION_NOT_EXIST') {
        result = {
          status: -1,
          msg: 'database collection <rank> does not exist',
          data: user.code
        }
        db.createCollection('rank');
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
        data: res
      }
    }
  }
  callback(null, result);
}

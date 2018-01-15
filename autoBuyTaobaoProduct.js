// ==UserScript==
// @name        autoBuyTaobaoProduct
// @include 	*
// @require     https://cdn.bootcss.com/jquery/3.2.1/jquery.min.js
// ==/UserScript==
$(document).ready(function(){

	//时间方法，只显示年月日
    Date.prototype.onlyYmd = function(){
		var month = this.getMonth() + 1 <= 10 ? '0' + (this.getMonth() + 1) : this.getMonth() + 1;
		var date = this.getDate() + 1 <= 10 ? '0' + this.getDate() : this.getDate();
		return this.getFullYear() + "-" + month + "-" + date;
	}


    //获取url参数（直接copy最近写的）
	if(!window.Toolib){window['Toolib'] = function(){}};

	/**
	 * 获取当前url或指定url参数
	 * @param  {[string]} url [url地址]
	 * @return {[obj]}     [返回对象参数]
	 */
	Toolib.prototype.queryUrlParam = function(url){

		url = url == null ? window.location.href : url
	    var search = url[0] === '?' ? url.substr(1) : url.substring(url.lastIndexOf('?') + 1)
	    if (search === '') return {}
	    search = search.split('&');

	    var query = {};
	    for (var i = 0; i < search.length; i++) {
	        var pair = search[i].split('=');
	        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
	    }

	    return query;
	}

/************************自动抢购淘宝商品****************************************/
    
    
    var pathname = location.pathname;//url地址
    var toolib = new Toolib();
    var urlData = toolib.queryUrlParam();

    //针对无skuId产品
    if(urlData['skuId']==undefined||urlData['skuId']=='null'){
    	var keyTime = urlData.itemId
    }else{
    	var keyTime = urlData.skuId;//获取id用于生成sessionStorage
    }
    
    var open = keyTime+'open';//初次进入时选择是否已开团
    var autoChangePrice = keyTime+'autoChangePrice';//初次进入时选择自动改价团还是指定时间团
    var productPrice = keyTime+'productPrice';


	if(pathname.indexOf('order')>=0 && pathname.indexOf('mtop')<0){//如果当前地址不是支付地址，不执行


		//初次进入选择默认方法
	    if(sessionStorage[open]==="null"||sessionStorage[open]==undefined){
	    	var openStatus = confirm('当前是否已开团？（若已开，为抢补拍请选确定）');
	    	if(openStatus==true){
	    		sessionStorage.setItem(open,true);
	    	}else{
	    		sessionStorage.setItem(open,false);
	    	}
	    	
	    }

	    if(sessionStorage[autoChangePrice]==="null"||sessionStorage[autoChangePrice]==undefined){
	    	var autoChangePriceStatus = confirm('当前是否已显示价格？（如果是到点自动改价，请点确定）');
	    	if(autoChangePriceStatus==true){
	    		sessionStorage.setItem(autoChangePrice,true);
	    	}else{
	    		sessionStorage.setItem(autoChangePrice,false);
	    	}
	    }

	    console.log(sessionStorage);
	    //默认配置项
	    var opts = {
	    	open : sessionStorage.open,
	    	today: new Date().onlyYmd(),
	    	autoreload : 10000,//当距离开团时间大于15秒时每几秒刷新一次
	    	robTime : 100,//抢购刷新时间
	    }

		//未开团(无法or可)提前购买方法
  		if(!opts.open){
  			var now = Date.parse(new Date());//获取当前时间戳

  			if(sessionStorage[keyTime]==="null"||sessionStorage[keyTime]==undefined){//如果未设置开团时间，提示设置

	  			console.log("当前状态为：团购未开始,请设置开团时间~");
	  			var getTime = prompt('请输入开团时间(只限当日开团)','20:00:00');
	  			sessionStorage[keyTime] = getTime;
	  			var timestamp = Date.parse(new Date(opts.today+' '+getTime));

	  			if(timestamp-now<0){
	  				console.log("设定时间不能小于当前时间！");
	  				return;
	  			}

	  			console.log("您设置的开团时间为："+getTime+",等待抢购中...");
	  			window.location.reload();

  			}else{//如果已设开团时间自动检测

  				var timestamp = Date.parse(new Date(opts.today+' '+sessionStorage[keyTime]));//获取开团时间戳
  				var time = (timestamp-now)/1000;//获取当前时间与开团时间的间隔秒数

  				console.warn("重设开团时间请重新打开浏览器");

  				//当距离开团时间不足15秒时（14-5秒之间），开始抢购
  				if(time<12&&time>=5){
					console.log("距离开团时间还有"+time+"秒，开始抢购...");
					//判断是否是到点自动改价
  					method(1000);
				}

				//为防止服务器挤爆异常，3秒开始快刷
				if(time<5 && time>=-2){
					console.log(time+'秒，快速刷新中...');
					method(opts.robTime);
				}

				//当开团时间已经大于当前时间时，继续抢购
				if(time<-2){
					console.log("团购已开始"+time+"秒，继续抢购中...");
					//判断是否是到点自动改价
  					method(1000);
				}

				//开团时间大于1000秒时，每100秒刷新一次
				if(time>1000){
					console.log("当前设定开团时间为："+sessionStorage[keyTime]+",距离开团时间还有："+time+"秒,等待抢购中...");
	  				judge(100000);
				}

				//开团时间大于100小于1000秒时，每20秒刷新一次
				if(time>100 && time<1000){
					console.log("当前设定开团时间为："+sessionStorage[keyTime]+",距离开团时间还有："+time+"秒,等待抢购中...");
	  				judge(20000);
				}

				//当距离开团时间超过15秒时，按默认配置的时间间隔刷新
				if(time<100 && time>=12){
  					console.log("当前设定开团时间为："+sessionStorage[keyTime]+",距离开团时间还有："+time+"秒,等待抢购中...");
  					judge(opts.autoreload);
  				}

  				function method(time){
  					//判断是否是到点自动改价
  					var bool = sessionStorage.getItem(autoChangePrice);
  					if(bool){
						changePriceBuy(time);
					}else{
						gotobuy(time);
					}
  				}

  				function judge(time){
  					var bool = sessionStorage.getItem(autoChangePrice);
  					setTimeout(function(bool){
	  					if(bool){
							getPrice();
						}
	  					window.location.reload();
	  				},time)
  				}
            }
  		}
  		//已开团(针对已开团但没抢到)
  		else{
  			gotobuy(1500);
  		}
	}
	else{
		console.warn('当前页面非订单页，请调试!');
	}

    function gotobuy(time){

    	//由于淘宝使用spa，设置定时器以便能获取到DOM
    	setTimeout(function(){
	    	var buyNow = document.getElementsByClassName('action')[0];//提交订单按钮
	    	var buy = document.getElementsByClassName("order-submitOrder")[0];//订单信息（出现则说明已可抢）
	    	var order = document.getElementsByClassName('order-confirmOrder')[0];//订单页面（用于识别服务器错误提示页面冲突）

	    	//如果页面正确，可下单
		    if(buy && order){
	            console.log('监测可下单，下单中...');
	            var evt = document.createEvent("MouseEvents");
	            evt.initEvent("click", true, true);
	            buyNow.dispatchEvent(evt);
		    }
		    //如果订单页面正常，无法下单
		    if(!buy && order){
		        console.log('抢购未成功,等待刷新...');
		        setInterval(function(){
		        	window.location.reload();
		        },time);
		        
		    }
		    //如果提示服务器错误
		    if(!order){
		    	console.log("刷新过于频繁，等待2秒后刷新...");
		    	setInterval(function(){
		        	window.location.reload();
		        },2000);
		    }
	    },350);
    }

    //天猫定时抢是到点自动刷新价格，与开团方法不同，重新编写方法
    function getPrice(){

    		var price = document.getElementsByClassName('main-price')[2].innerHTML;

	    	if(sessionStorage[productPrice]==="null"||sessionStorage[productPrice]==undefined){//将未到时间价格记录到sessionStorage
	    		sessionStorage.setItem(productPrice,price);
	    	}
    }
    function changePriceBuy(time){

    	//由于淘宝使用spa，设置定时器以便能获取到DOM
    	setTimeout(function(){
	    	var order = document.getElementsByClassName('order-confirmOrder')[0];//订单页面（用于识别服务器错误提示页面冲突）

			
		    //如果提示服务器错误
		    if(!order){
		    	console.log("刷新过于频繁，等待2秒后刷新...");
		    	setInterval(function(){
		        	window.location.reload();
		        },2000);
		    }else{			

	    		var price = document.getElementsByClassName('main-price')[2].innerHTML;//获取价格
		    	var buyNow = document.getElementsByClassName('action')[0];//提交订单按钮
		    	var buy = document.getElementsByClassName("order-submitOrder")[0];//订单信息（出现则说明已可抢）

		    	//如果页面正确，可下单
			    if(sessionStorage[productPrice]!=price){
		            console.log('监测价格已变，下单中...');
	            	var evt = document.createEvent("MouseEvents");
	            	evt.initEvent("click", true, true);
	            	buyNow.dispatchEvent(evt);
		            
			    }

			    //如果订单页面正常，无法下单
			    if(sessionStorage[productPrice]==price){
			        console.log('当前价格未改变,等待刷新...');
			        setInterval(function(){
			        	window.location.reload();
			        },time);
			        
			    }
		    }

	    },350);
    }

});
/**
 * 入口文件
 * @author xiaoqiang <465633678@qq.com>
 * @created 2019/10/21 17:38:23
 */
import * as vue from 'zqvue'
const { createApp, createComponent, onMounted, onBeforeMount, ref }: any = vue
console.log(vue)
const app = createComponent({
  template: '<div>{{ data }}</div>',
  setup(prop: any) {
    const data = ref(3)
    onMounted(() => {
      console.log('onMounted')
    })
    onBeforeMount(() => {
      console.log('onBeforeMount')
    })
    console.log(this)
    setTimeout(() => {
      data.value += 2
    }, 2000)
    return {
      data
    }
  }
})
createApp().mount(app, '#app')

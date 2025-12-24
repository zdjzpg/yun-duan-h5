import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd, {
  Button,
  DatePicker,
  ConfigProvider,
  Card,
  Form,
  Checkbox,
  Radio,
  Input,
  Select,
  TreeSelect,
  Cascader,
  InputNumber,
  Upload,
  Progress,
  Alert,
  Space,
  Typography,
  Skeleton,
  List,
} from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import './styles/main.less'
import YSwitch from './components/YSwitch.vue'
import YDatePicker from './components/YDatePicker.vue'
import YDatePickerRange from './components/YDatePickerRange.vue'
import YUpload from './components/YUpload.vue'
import YUploadDraggable from './components/YUploadDraggable.vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app
  .use(Antd)
  .use(ConfigProvider)
  .use(Button)
  .use(DatePicker)
  .use(Card)
  .use(Form)
  .use(Checkbox)
  .use(Radio)
  .use(Input)
  .use(Select)
  .use(TreeSelect)
  .use(Cascader)
  .use(InputNumber)
  .use(Upload)
  .use(Progress)
  .use(Alert)
  .use(Space)
  .use(Typography)
  .use(Skeleton)
  .use(List)

app.component('YSwitch', YSwitch)
app.component('YDatePicker', YDatePicker)
app.component('YDatePickerRange', YDatePickerRange)
app.component('YUpload', YUpload)
app.component('YUploadDraggable', YUploadDraggable)
app.mount('#YunDuanH5')

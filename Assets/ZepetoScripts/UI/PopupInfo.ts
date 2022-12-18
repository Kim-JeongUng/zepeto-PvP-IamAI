import {ZepetoScriptBehaviour} from 'ZEPETO.Script'
import {Color, Coroutine, GameObject, Time} from 'UnityEngine';
import {Image} from 'UnityEngine.UI';

export default class PopupInfo extends ZepetoScriptBehaviour {

    private m_bg: Image;
    //private m_infoText:Text;
    
    private m_disapearCoroutine:Coroutine = null;
    private m_disapperTime:number = 1.5;

    Awake() {
        this.m_bg = this.GetComponentInChildren<Image>();
        //this.m_infoText = this.m_bg.GetComponentInChildren<Text>();
    }

    public OnEnable()
    {
        if (this.m_disapearCoroutine != null)
        {
            this.StopCoroutine(this.m_disapearCoroutine);
            this.m_bg.color = new Color(this.m_bg.color.r, this.m_bg.color.g, this.m_bg.color.b, 0.94);
        }

        this.m_disapearCoroutine = this.StartCoroutine(this.CloseInfo());
    }

    private *CloseInfo()
    {
        let time:number = 0;
        while (time < this.m_disapperTime)
        {
            time += Time.deltaTime;
            yield null;
        }

        while (this.m_bg.color.a > 0.1)
        {
            this.m_bg.color = new Color(this.m_bg.color.r, this.m_bg.color.g, this.m_bg.color.b, this.m_bg.color.a - (5 * Time.deltaTime));
            //this.m_infoText.color = new Color(this.m_bg.color.r, this.m_bg.color.g, this.m_bg.color.b, this.m_bg.color.a - (5 * Time.deltaTime));
            yield null;
        }

        GameObject.Destroy(this.gameObject);
    }
}
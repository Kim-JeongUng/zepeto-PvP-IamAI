import {ZepetoScriptBehaviour} from 'ZEPETO.Script'
import {ZepetoWorldMultiplay, ZepetoWorldHelper, Users} from "ZEPETO.World";
import {AnimationClip, RectTransform, Transform, Mathf, Texture, WaitForSeconds} from "UnityEngine";
import {Button, Image, Text,RawImage} from "UnityEngine.UI";
import {Room} from "ZEPETO.Multiplay";
import {ZepetoPlayers} from "ZEPETO.Character.Controller";

export default class GameStartPanel extends ZepetoScriptBehaviour {

    @SerializeField() private _multiplay: ZepetoWorldMultiplay;
    @SerializeField() private _StartBtn: Button;
    @SerializeField() private _AICountUpBtn: Button;
    @SerializeField() private _AICountDownBtn: Button;
    @SerializeField() private _PlayerPanel: RectTransform[];
    @SerializeField() private _PlayerPanelOnImage: Texture;
    @SerializeField() private _PlayerPanelOffImage: Texture;
    @SerializeField() private NumberOfAIText: Text;

    private room: Room;
    private isMasterClient: boolean = false;
    private PlayerMaxLength: number = 8;

    private NumberOfAI: number = 10;

    OnEnable(){
        this.room.Send("CheckMaster");
    }
    Start() {
        this._multiplay.RoomCreated += (room: Room) => {
            this.room = room;
        };

        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this.room.Send("CheckMaster");
            this.room.AddMessageHandler("CheckMaster", (MasterClientSessionId) => {
                if (this.room.SessionId == MasterClientSessionId) {
                    if (!this.isMasterClient) {
                        this.isMasterClient = true;
                        console.log("Master");
                        
                        //방장만 게임시작 버튼 활성화                            
                        this._StartBtn.onClick.AddListener(() => {
                            this.room.Send("GameStart", this.NumberOfAI);
                            console.log("GameStart");
                        });
                        this._AICountUpBtn.onClick.AddListener(() => {
                            this.NumberOfAI = Mathf.Clamp(this.NumberOfAI + 1, 0, 20);
                            this.room.Send("ChangeNumberOfAI", this.NumberOfAI);
                        });
                        this._AICountDownBtn.onClick.AddListener(() => {
                            this.NumberOfAI = Mathf.Clamp(this.NumberOfAI - 1, 0, 20);
                            this.room.Send("ChangeNumberOfAI", this.NumberOfAI);
                        });
                    }
                    //새로운 유저가 들어오면
                    this.room.Send("ChangeNumberOfAI", this.NumberOfAI);
                    this.room.Send("ReceiveAllPlayer");
                }
            });

            this.room.AddMessageHandler("ReceiveAllPlayer", (usersID: string[]) => {
                ZepetoWorldHelper.GetUserInfo(usersID, (info: Users[]) => {
                    for (let i = 0; i < info.length; i++) {
                        this._PlayerPanel[i].GetComponentInChildren<Text>().text = info[i].name
                        this._PlayerPanel[i].GetComponent<RawImage>().texture = this._PlayerPanelOnImage;
                        ZepetoWorldHelper.GetProfileTexture(usersID[i],(thumb:Texture)=>{
                            this._PlayerPanel[i].GetComponent<RawImage>().texture = thumb;
                        },(error) => {
                            console.log(error);                        
                        });
                        console.log(`userId : ${info[i].userOid}, name : ${info[i].name}, zepetoId : ${info[i].zepetoId}`);
                    }
                }, (error) => {
                    console.log(error);
                });
                for (let i = usersID.length; i < this.PlayerMaxLength; i++) {
                    this._PlayerPanel[i].GetComponentInChildren<Text>().text = "";
                    this._PlayerPanel[i].GetComponent<RawImage>().texture = this._PlayerPanelOffImage;
                }
            });
            this.room.AddMessageHandler("GameStart", (message) => {
                this.StartCoroutine(this.GameStart());
            });
            this.room.AddMessageHandler("ChangeNumberOfAI", (message: number) => {
                this.NumberOfAIText.text = message.toString();
            });
        });
    }
    * GameStart(){
        yield new WaitForSeconds(1);
        this.gameObject.SetActive(false);
    }
}
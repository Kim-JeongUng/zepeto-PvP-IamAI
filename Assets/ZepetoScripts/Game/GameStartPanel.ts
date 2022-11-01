import {ZepetoScriptBehaviour} from 'ZEPETO.Script'
import {ZepetoWorldMultiplay} from "ZEPETO.World";
import {AnimationClip, RectTransform, Sprite, Transform} from "UnityEngine";
import {Button,Image, Text} from "UnityEngine.UI";
import {Room} from "ZEPETO.Multiplay";
import {ZepetoPlayers} from "ZEPETO.Character.Controller";

export default class GameStartPanel extends ZepetoScriptBehaviour {

    @SerializeField() private _multiplay: ZepetoWorldMultiplay;
    @SerializeField() private _StartBtn: Button;
    @SerializeField() private _PlayerPanel: RectTransform[];
    @SerializeField() private _PlayerPanelOnImage: Sprite;
    @SerializeField() private _PlayerPanelOffImage: Sprite;

    private room: Room;
    private isMasterClient: boolean = false;
    private PlayerMaxLength: number = 8;

    Start() {
        this._multiplay.RoomCreated += (room: Room) => {
            this.room = room;

        };

        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this.room.Send("CheckMaster")
            this.room.AddMessageHandler("CheckMaster", (MasterClientSessionId) => {
                if (this.room.SessionId == MasterClientSessionId) {
                    if (!this.isMasterClient) {
                        this.isMasterClient = true;
                        //방장만 게임시작 버튼 활성화                            
                        console.log("Master");
                        this._StartBtn.onClick.AddListener(() => {
                            this.room.Send("GameStart");
                            console.log("GameStart");
                        });
                    }
                }
                
            });
            this.room.Send("ReceiveAllPlayer");
            this.room.AddMessageHandler("ReceiveAllPlayer", (message: string[]) => {
                for (let i = 0; i < message.length; i++) {
                    this._PlayerPanel[i].GetComponentInChildren<Text>().text = message[i];
                    this._PlayerPanel[i].GetComponent<Image>().sprite = this._PlayerPanelOnImage;
                }
                for (let i = message.length; i < this.PlayerMaxLength; i++) {
                    this._PlayerPanel[i].GetComponentInChildren<Text>().text = "";
                    this._PlayerPanel[i].GetComponent<Image>().sprite = this._PlayerPanelOffImage;
                }
            });
            
            
            this.room.AddMessageHandler("GameStart", (message) => {
                this.gameObject.SetActive(false);
            });
        });
    }
}
import {ZepetoScriptBehaviour} from 'ZEPETO.Script'
import {ZepetoWorldMultiplay, ZepetoWorldHelper, Users} from "ZEPETO.World";
import {AnimationClip, RectTransform, Transform, Mathf, Texture, WaitForSeconds, Object, Resources, GameObject} from "UnityEngine";
import {Button, Image, Text,RawImage} from "UnityEngine.UI";
import {Room} from "ZEPETO.Multiplay";
import {ZepetoPlayers} from "ZEPETO.Character.Controller";
import MultiplayManager from '../MultiplaySync/Common/MultiplayManager';

export default class LobyPanel extends ZepetoScriptBehaviour {
    @SerializeField() private m_StartBtn: Button;
    @SerializeField() private m_AICountUpBtn: Button;
    @SerializeField() private m_AICountDownBtn: Button;
    @SerializeField() private m_PlayerPanel: RectTransform[];
    @SerializeField() private m_PlayerPanelOnImage: Texture;
    @SerializeField() private m_PlayerPanelOffImage: Texture;
    @SerializeField() private m_NumberOfAIText: Text;
    
    private m_popupInfo: GameObject;

    private room: Room;
    private m_isMasterClient: boolean = false;
    private m_PlayerMaxLength: number = 8;
    private m_playerCount: number = 0;
    private m_users: Users[] = [];

    private NumberOfAI: number = 10;
   
    private Start() {
        this.m_popupInfo = Resources.Load("PopupInfo") as GameObject;

        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this.room = MultiplayManager.instance.room;
            this.Init();
        });
    }

    private Init() {
        this.room.AddMessageHandler("GameStart", (message) => {
            this.StartCoroutine(this.GameStart());
        });
        this.room.AddMessageHandler("ChangeNumberOfAI", (message: number) => {
            this.m_NumberOfAIText.text = message.toString();
        });

        this.room.AddMessageHandler("ReceiveAllPlayer", (usersID: string[]) => {
            ZepetoWorldHelper.GetUserInfo(usersID, (info: Users[]) => {
                this.m_playerCount = info.length;
                for (let i = 0; i < this.m_playerCount; i++) {
                    if (this.m_users[i]?.zepetoId != info[i]?.zepetoId) {
                        this.m_PlayerPanel[i].GetComponentInChildren<Text>().text = info[i].name;
                        this.m_PlayerPanel[i].GetComponent<RawImage>().texture = this.m_PlayerPanelOnImage;
                        ZepetoWorldHelper.GetProfileTexture(usersID[i], (thumb: Texture) => {
                            this.m_PlayerPanel[i].GetComponent<RawImage>().texture = thumb;
                        }, (error) => {
                            console.log(error);
                        });
                        console.log(`userId : ${info[i].userOid}, name : ${info[i].name}, zepetoId : ${info[i].zepetoId}`);
                    }
                }
                this.m_users = info;
            }, (error) => {
                console.log(error);
            });
            for (let i = usersID.length; i < this.m_PlayerMaxLength; i++) {
                this.m_PlayerPanel[i].GetComponentInChildren<Text>().text = "";
                this.m_PlayerPanel[i].GetComponent<RawImage>().texture = this.m_PlayerPanelOffImage;
            }
        });

        this.room.Send("CheckMaster");
        this.room.AddMessageHandler("CheckMaster", (MasterClientSessionId) => {
            if (this.room.SessionId == MasterClientSessionId) {
                if (!this.m_isMasterClient) { //처음 한번만
                    this.m_isMasterClient = true;
                    console.log("Master");

                    this.m_StartBtn.interactable = true;
                    this.m_AICountUpBtn.interactable = true;
                    this.m_AICountDownBtn.interactable = true;

                    //방장만 게임시작 버튼 활성화                            
                    this.m_StartBtn.onClick.AddListener(() => {
                        if(this.m_playerCount < 2){
                            Object.Instantiate(this.m_popupInfo,this.transform);
                            this.m_StartBtn.interactable = true;
                            return; //testcode
                        }
                        this.room.Send("GameStart", this.NumberOfAI);
                        console.log("GameStart");
                    });
                    this.m_AICountUpBtn.onClick.AddListener(() => {
                        this.NumberOfAI = Mathf.Clamp(this.NumberOfAI + 1, 0, 20);
                        this.room.Send("ChangeNumberOfAI", this.NumberOfAI);
                    });
                    this.m_AICountDownBtn.onClick.AddListener(() => {
                        this.NumberOfAI = Mathf.Clamp(this.NumberOfAI - 1, 0, 20);
                        this.room.Send("ChangeNumberOfAI", this.NumberOfAI);
                    });
                }
                //새로운 유저가 들어오면
                this.room.Send("ChangeNumberOfAI", this.NumberOfAI);
                this.room.Send("ReceiveAllPlayer");
            }
            else{
                this.m_StartBtn.interactable = false;
                this.m_AICountUpBtn.interactable = false;
                this.m_AICountDownBtn.interactable = false;
            }
        });
    }
    private * GameStart(){
        yield new WaitForSeconds(1);
        this.gameObject.SetActive(false);
    }
}
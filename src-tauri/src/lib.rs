use serde::{Deserialize, Serialize};
use std::process::Command;
use sysinfo::System;
use std::fs;
use std::path::PathBuf;
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::{Manager, State};

#[derive(Default, Serialize, Deserialize, Clone)]
pub struct InfoProcessoConta {
    pub conta_id: String,
    pub user_id: Option<u64>,
}

fn processo_exemplo_exe() -> Option<PathBuf> {
    let mut sistema = System::new_all();
    sistema.refresh_all();
    sistema
        .processes()
        .values()
        .find_map(|p| p.exe().map(|path| path.to_path_buf()))
}

fn obter_ultimo_place_universe_logs(log_dirs: &[PathBuf]) -> Option<(u64, u64)> {
    let mut entries: Vec<_> = Vec::new();
    for dir in log_dirs {
        if !dir.exists() { continue; }
        if let Ok(iter) = std::fs::read_dir(dir) {
            for e in iter.flatten() {
                entries.push(e);
            }
        }
    }

    if entries.is_empty() {
        return None;
    }

    entries.sort_by_key(|e| e.file_name());
    entries.reverse();

    let extrair_id = |label: &str, linha: &str| -> Option<u64> {
        if let Some(idx) = linha.find(label) {
            let slice = &linha[idx + label.len()..];
            let token = slice
                .split(|c: char| !c.is_ascii_digit())
                .find(|s| !s.is_empty());
            if let Some(tok) = token {
                return tok.parse::<u64>().ok();
            }
        }
        None
    };

    for entry in entries {
        if let Ok(meta) = entry.metadata() {
            if meta.is_file() {
                if let Ok(conteudo) = std::fs::read_to_string(entry.path()) {
                    for linha in conteudo.lines().rev() {
                        let linha_lower = linha.to_lowercase();
                        if linha_lower.contains("placeid") && linha_lower.contains("universeid") {
                            let pid_log = extrair_id("placeid", &linha_lower);
                            let uid_log = extrair_id("universeid", &linha_lower);

                            if let (Some(pid), Some(uid)) = (pid_log, uid_log) {
                                #[cfg(debug_assertions)]
                                println!("[DEBUG] Fallback ultimo log place/universe: {} / {}", pid, uid);
                                return Some((pid, uid));
                            }
                        }
                    }
                }
            }
        }
    }

    None
}

fn extrair_job_id_cmd(args: &[String]) -> Option<String> {
    // Procura argumento ou URL contendo gameId=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
    for arg in args {
        if arg.contains("gameid=") || arg.contains("GameId=") {
            if let Some(pos) = arg.to_lowercase().find("gameid=") {
                let slice = &arg[pos + "gameid=".len()..];
                let token = slice
                    .split(|c: char| c == '&' || c == '"' || c == '\'' || c == ' ')
                    .find(|s| !s.is_empty());
                if let Some(tok) = token {
                    return Some(tok.to_string());
                }
            }
        }
    }
    None
}

// Estado Global para mapear PID do processo -> Informações da Conta
#[derive(Default)]
pub struct MapaPidsContas(pub Mutex<HashMap<u32, InfoProcessoConta>>);

// Estado Global para cache de nomes de jogos (PlaceId -> Nome)
#[derive(Default)]
pub struct CacheJogos(pub Mutex<HashMap<u64, String>>);

#[cfg(windows)]
use std::os::windows::process::CommandExt;

fn caminho_mapa_pids_compartilhado() -> PathBuf {
    let local_app_data_origin = std::env::var("LOCALAPPDATA").unwrap_or_else(|_| "C:\\".to_string());
    let mut base = PathBuf::from(&local_app_data_origin);
    base.push("MultiRobloxManager");
    let _ = std::fs::create_dir_all(&base);
    base.push("pids_contas.json");
    base
}

fn ler_mapa_pids_compartilhado() -> HashMap<u32, InfoProcessoConta> {
    let caminho = caminho_mapa_pids_compartilhado();
    if let Ok(conteudo) = std::fs::read_to_string(&caminho) {
        serde_json::from_str(&conteudo).unwrap_or_default()
    } else {
        HashMap::new()
    }
}

fn salvar_mapa_pids_compartilhado(mapa: &HashMap<u32, InfoProcessoConta>) {
    let caminho = caminho_mapa_pids_compartilhado();
    if let Ok(json) = serde_json::to_string_pretty(mapa) {
        let _ = std::fs::write(caminho, json);
    }
}

fn mapa_pids_inicial() -> MapaPidsContas {
    let persistido = ler_mapa_pids_compartilhado();
    MapaPidsContas(Mutex::new(persistido))
}

fn extrair_place_id_cmd(args: &[String]) -> Option<u64> {
    for arg in args {
        if arg.contains("PlaceLauncher.ashx") || arg.contains("placeId=") {
            if let Some(idx) = arg.to_lowercase().find("placeid=") {
                let slice = &arg[idx + 8..];
                let fim = slice.find('&').unwrap_or(slice.len());
                if let Ok(pid) = slice[..fim].trim().parse::<u64>() {
                    return Some(pid);
                }
            }
        }
    }
    None
}

// ─────────────────────────────────────────────
// Structs de dados
// ─────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InfoInstancia {
    pub pid: u32,
    pub nome_processo: String,
    pub tempo_iniciado_secs: u64,
    pub conta_id: Option<String>,
    pub place_id: Option<u64>,
    pub universe_id: Option<u64>,
    pub nome_jogo: Option<String>,
    pub versao: Option<String>,
    pub caminho_cliente: Option<String>,
    pub job_id: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct InfoJogoRoblox {
    pub place_id: u64,
    pub universe_id: u64,
    pub nome: String,
    pub descricao: String,
    pub thumbnail_url: Option<String>,
    pub jogadores_ativos: Option<u64>,
    pub criador_nome: Option<String>,
    pub curtidas: Option<u64>,
    pub favorito_local: Option<bool>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct RespostaBuscaJogos {
    pub virgula_anterior: Option<String>,
    pub virgula_proxima: Option<String>,
    pub jogos: Vec<InfoJogoRoblox>,
}


#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ClienteRoblox {
    pub nome: String,
    pub caminho: String,
    pub tipo: String, // "oficial", "bloxstrap", "voidstrap", "custom"
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct InfoUsuarioRoblox {
    pub id: u64,
    pub nome: String,
    pub nome_display: String,
    pub avatar_url: String,
    pub descricao: String,
    pub e_premium: bool,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ContaImportada {
    pub perfil: InfoUsuarioRoblox,
    pub cookie: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ContaSalva {
    pub id: String,
    pub cookie: String,
    pub usuario: InfoUsuarioRoblox,
    pub data_adicionada: u64,
}

#[derive(Serialize, Deserialize)]
struct RespostaUsuarioRoblox {
    data: Vec<DadosUsuario>,
}

#[derive(Serialize, Deserialize)]
struct DadosUsuario {
    id: u64,
    name: String,
    #[serde(rename = "displayName")]
    display_name: String,
    description: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct RespostaAvatarRoblox {
    data: Vec<DadosAvatar>,
}

#[derive(Serialize, Deserialize)]
struct DadosAvatar {
    #[serde(rename = "imageUrl")]
    image_url: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct RespostaLogin {
    user: Option<DadosUsuario>,
    #[serde(rename = "twoStepVerificationData")]
    two_step_data: Option<serde_json::Value>,
}

// ─────────────────────────────────────────────
// Funções auxiliares
// ─────────────────────────────────────────────

/// Cria o mutex global que o Roblox usa como singleton.
/// Ao segurarmos esse mutex primeiro, o Roblox não consegue impedir
/// a abertura de múltiplas instâncias.
#[cfg(windows)]
fn criar_mutex_roblox() {
    use std::ffi::OsStr;
    use std::iter::once;
    use std::os::windows::ffi::OsStrExt;

    let nome_mutex: Vec<u16> = OsStr::new("ROBLOX_singletonEvent")
        .encode_wide()
        .chain(once(0))
        .collect();

    unsafe {
        // Cria ou abre o mutex - retorna um handle que intencionalmente
        // NÃO fechamos, para continuar "segurando" o mutex enquanto o app estiver aberto.
        winapi::um::synchapi::CreateMutexW(std::ptr::null_mut(), 0, nome_mutex.as_ptr());
        // handle propositalmente vazado para manter o mutex vivo durante toda a sessão
    }
}

#[cfg(not(windows))]
fn criar_mutex_roblox() {
    // Em outras plataformas não é necessário
}

fn obter_clientes_roblox() -> Vec<ClienteRoblox> {
    let mut clientes = Vec::new();
    let local_app_data = std::env::var("LOCALAPPDATA").unwrap_or_default();

    if local_app_data.is_empty() {
        return clientes;
    }

    // 1. Roblox Oficial (Caminho de versão dinâmico)
    let caminho_roblox = format!("{}\\Roblox\\Versions", local_app_data);
    if let Ok(entradas) = std::fs::read_dir(&caminho_roblox) {
        for entrada in entradas.flatten() {
            let caminho = entrada.path();
            if caminho.is_dir() {
                let roblox_exe = caminho.join("RobloxPlayerBeta.exe");
                if roblox_exe.exists() {
                    clientes.push(ClienteRoblox {
                        nome: "Roblox Oficial".to_string(),
                        caminho: roblox_exe.to_string_lossy().to_string(),
                        tipo: "oficial".to_string(),
                    });
                    break; // Pegamos apenas a versão mais recente encontrada
                }
            }
        }
    }

    // 2. Bloxstrap
    let bloxstrap_exe = format!("{}\\Bloxstrap\\Bloxstrap.exe", local_app_data);
    if std::path::Path::new(&bloxstrap_exe).exists() {
        clientes.push(ClienteRoblox {
            nome: "Bloxstrap".to_string(),
            caminho: bloxstrap_exe,
            tipo: "bloxstrap".to_string(),
        });
    }

    // 3. Voidstrap
    let voidstrap_exe = format!("{}\\Voidstrap\\Voidstrap.exe", local_app_data);
    if std::path::Path::new(&voidstrap_exe).exists() {
        clientes.push(ClienteRoblox {
            nome: "Voidstrap".to_string(),
            caminho: voidstrap_exe,
            tipo: "voidstrap".to_string(),
        });
    }

    // 4. Fishtrap
    let fishtrap_exe = format!("{}\\Fishtrap\\Fishtrap.exe", local_app_data);
    if std::path::Path::new(&fishtrap_exe).exists() {
        clientes.push(ClienteRoblox {
            nome: "Fishtrap".to_string(),
            caminho: fishtrap_exe,
            tipo: "fishtrap".to_string(),
        });
    }

    clientes
}

// ─────────────────────────────────────────────
// Comandos Tauri
// ─────────────────────────────────────────────

#[tauri::command]
async fn lancar_roblox(
    caminho_customizado: Option<String>,
    ticket: Option<String>,
    conta_id: Option<String>,
    user_id: Option<u64>,
    place_id: Option<u64>,
    job_id: Option<String>,
    mapa_state: State<'_, MapaPidsContas>,
) -> Result<String, String> {
    criar_mutex_roblox();

    let (caminho, _versions_path) = if let Some(c) = caminho_customizado {
        (c, None)
    } else {
        let cli = obter_clientes_roblox()
            .first()
            .map(|c| (c.caminho.clone(), std::path::PathBuf::from(&c.caminho).parent().and_then(|p| p.parent()).map(|p| p.to_path_buf())))
            .ok_or_else(|| "Nenhum cliente Roblox detectado automaticamente.".to_string())?;
        (cli.0, cli.1)
    };

    let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis();
    let browser_tracker_id = now.to_string();

    let mut args = Vec::new();
    args.push("--app".to_string());
    if let Some(ref t) = ticket {
        args.push("-t".to_string());
        args.push(t.clone());
    }
    args.push("-b".to_string());
    args.push(browser_tracker_id);
    args.push("--launchtime".to_string());
    args.push(now.to_string());
    if let Some(pid) = place_id {
        args.push("-j".to_string());
        if let Some(ref jid) = job_id {
            if jid.trim().is_empty() {
                args.push(format!("https://assetgame.roblox.com/game/PlaceLauncher.ashx?request=RequestGame&placeId={}&isPlayTogetherGame=false", pid));
            } else {
                args.push(format!("https://assetgame.roblox.com/game/PlaceLauncher.ashx?request=RequestGameJob&placeId={}&gameId={}&isPlayTogetherGame=false", pid, jid.trim()));
            }
        } else {
            args.push(format!("https://assetgame.roblox.com/game/PlaceLauncher.ashx?request=RequestGame&placeId={}&isPlayTogetherGame=false", pid));
        }
    }

    // Nova Estratégia de Redirecionamento Dinâmico (Account Isolation Swap)
    if let Some(ref id) = conta_id {
        let local_app_data_origin = std::env::var("LOCALAPPDATA").unwrap_or_else(|_| "C:\\\\".to_string());
        let global_roblox_dir = std::path::PathBuf::from(&local_app_data_origin).join("Roblox");
        let global_ls_dir = global_roblox_dir.join("LocalStorage");
        let global_ls_backup = global_roblox_dir.join("LocalStorage_GlobalBackupMAN");

        let id_clean = id.replace("-", "");
        let mut isolated_root = std::path::PathBuf::from(&local_app_data_origin);
        isolated_root.push("MultiRobloxManager");
        isolated_root.push("IsolatedStorage");
        isolated_root.push(&id_clean);

        let isolated_ls_dir = isolated_root.join("AppData").join("Local").join("Roblox").join("LocalStorage");
        let _ = std::fs::create_dir_all(&isolated_ls_dir);

        if global_ls_dir.exists() {
            // No Windows moderno, is_symlink() detecta Junctions se o metadata for link.
            if global_ls_dir.is_symlink() {
                let _ = std::fs::remove_dir(&global_ls_dir);
            } else {
                if !global_ls_backup.exists() {
                    let _ = std::fs::rename(&global_ls_dir, &global_ls_backup);
                } else {
                    let _ = std::fs::remove_dir_all(&global_ls_dir);
                }
            }
        }

        // Criar a Junção Global -> Isolada
        let _ = Command::new("cmd")
            .args(&[
                "/C", 
                "mklink", 
                "/J", 
                global_ls_dir.to_str().unwrap(), 
                isolated_ls_dir.to_str().unwrap()
            ])
            .creation_flags(0x08000000) 
            .status();
            
        println!("[DEBUG] Redirecionamento ATIVADO para conta: {}", id);
    }

    let mut cmd = Command::new(&caminho);
    cmd.args(&args);

    if let Some(ref id) = conta_id {
        let local_app_data_origin = std::env::var("LOCALAPPDATA").unwrap_or_else(|_| "C:\\\\".to_string());
        let id_clean = id.replace("-", "");
        let mut isolated_root = std::path::PathBuf::from(&local_app_data_origin);
        isolated_root.push("MultiRobloxManager");
        isolated_root.push("IsolatedStorage");
        isolated_root.push(&id_clean);
        let isolated_local_app_data = isolated_root.join("AppData").join("Local");
        let isolated_roaming_app_data = isolated_root.join("AppData").join("Roaming");

        cmd.env("LOCALAPPDATA", &isolated_local_app_data);
        cmd.env("APPDATA", &isolated_roaming_app_data);
        cmd.env("WEBVIEW2_USER_DATA_FOLDER", &isolated_local_app_data);
    }

    let child = cmd.spawn()
        .map_err(|erro| format!("Erro ao lançar o Roblox: {}", erro))?;
        
    let pid = child.id();

    if let Some(ref cid) = conta_id {
        let mut mapa = mapa_state.0.lock().unwrap_or_else(|e| e.into_inner());
        mapa.insert(pid, InfoProcessoConta {
            conta_id: cid.clone(),
            user_id,
        });
        salvar_mapa_pids_compartilhado(&mapa);
    }

    if conta_id.is_some() {
        let local_app_data_origin = std::env::var("LOCALAPPDATA").unwrap_or_else(|_| "C:\\\\".to_string());
        let global_roblox_dir = std::path::PathBuf::from(&local_app_data_origin).join("Roblox");
        let global_ls_dir = global_roblox_dir.join("LocalStorage");
        let global_ls_backup = global_roblox_dir.join("LocalStorage_GlobalBackupMAN");

        tokio::spawn(async move {
            tokio::time::sleep(std::time::Duration::from_secs(10)).await;

            // Se ainda houver Roblox rodando, não desmonta o redirecionamento
            let mut sistema = sysinfo::System::new_all();
            sistema.refresh_processes(sysinfo::ProcessesToUpdate::All, true);
            let ainda_rodando = sistema.processes().values().any(|p| {
                let nome = p.name().to_string_lossy().to_lowercase();
                nome.contains("robloxplayer")
            });
            if ainda_rodando {
                #[cfg(debug_assertions)]
                println!("[DEBUG] Mantendo redirecionamento: Roblox ainda em execução");
                return;
            }

            #[cfg(debug_assertions)]
            println!("[DEBUG] Desativando redirecionamento...");
            let _ = std::fs::remove_dir(&global_ls_dir);
            if global_ls_backup.exists() {
                let _ = std::fs::rename(&global_ls_backup, &global_ls_dir);
            }
        });
    }

    Ok(format!("Lançado com sucesso (PID: {})", pid))
}

struct InfoJogoLog {
    place_id: u64,
    universe_id: u64,
}

/// Escaneia os logs recentes do Roblox para mapear UserId -> PlaceId/UniverseId}

fn obter_mapeamento_jogos_logs(log_dirs: &[PathBuf]) -> HashMap<u64, InfoJogoLog> {
    let mut mapeamento = HashMap::new();

    let mut logs: Vec<std::fs::DirEntry> = Vec::new();
    for dir in log_dirs {
        if !dir.exists() { continue; }
        if let Ok(entries) = std::fs::read_dir(dir) {
            logs.extend(entries.filter_map(|e| e.ok()).filter(|e| e.path().extension().map_or(false, |ext| ext == "log")));
        }
    }

    if logs.is_empty() {
        return mapeamento;
    }

    logs.sort_by(|a, b| {
        b.metadata().and_then(|m| m.modified()).unwrap_or(std::time::SystemTime::UNIX_EPOCH)
            .cmp(&a.metadata().and_then(|m| m.modified()).unwrap_or(std::time::SystemTime::UNIX_EPOCH))
    });

    let limite_tempo = std::time::SystemTime::now()
        .checked_sub(std::time::Duration::from_secs(300))
        .unwrap_or(std::time::SystemTime::UNIX_EPOCH);

    for entry in logs.iter().take(30) {
        if let Ok(meta) = entry.metadata() {
            if let Ok(modificado) = meta.modified() {
                if modificado < limite_tempo {
                    continue; // pula logs antigos para evitar cache de jogos antigos
                }
            }
        }

        if let Ok(conteudo) = std::fs::read_to_string(entry.path()) {
            for linha in conteudo.lines().rev() {
                let linha_lower = linha.to_lowercase();
                if linha_lower.contains("report game_join_loadtime") {
                    let extrair_id = |label: &str, linha: &str| -> Option<u64> {
                        if let Some(idx) = linha.find(label) {
                            let slice = &linha[idx + label.len()..];
                            let token = slice
                                .split(|c: char| !c.is_ascii_digit())
                                .find(|s| !s.is_empty());
                            if let Some(tok) = token {
                                return tok.parse::<u64>().ok();
                            }
                        }
                        None
                    };

                    let pid_log = extrair_id("placeid", &linha_lower);
                    let uid_log = extrair_id("universeid", &linha_lower);
                    let user_log = extrair_id("userid", &linha_lower);

                    if let (Some(pid), Some(uid), Some(user)) = (pid_log, uid_log, user_log) {
                        if !mapeamento.contains_key(&user) {
                            mapeamento.insert(user, InfoJogoLog {
                                place_id: pid,
                                universe_id: uid,
                            });
                            #[cfg(debug_assertions)]
                            println!("[DEBUG] map logs user {} place {} uni {}", user, pid, uid);
                        }
                    }
                }
            }
        }
    }

    mapeamento
}

fn construir_dirs_logs(exe_path: Option<&PathBuf>) -> Vec<PathBuf> {
    let mut dirs = Vec::new();
    if let Ok(local_app_data) = std::env::var("LOCALAPPDATA") {
        dirs.push(std::path::Path::new(&local_app_data).join("Roblox").join("logs"));
    }
    if let Some(exe) = exe_path {
        if let Some(parent) = exe.parent() {
            dirs.push(parent.join("logs"));
            if let Some(pp) = parent.parent() {
                dirs.push(pp.join("logs"));
                if let Some(ppp) = pp.parent() {
                    dirs.push(ppp.join("logs"));
                }
            }
        }
    }
    #[cfg(debug_assertions)]
    println!("[DEBUG] Dirs de logs considerados: {:?}", dirs);
    dirs
}

/// Busca o nome do jogo sem exigir cookie, preferindo universeId quando disponível
async fn buscar_nome_jogo(place_id: u64, universe_id: Option<u64>) -> Result<String, String> {
    let cliente = reqwest::Client::new();

    // 1) Tenta via universeId (API pública)
    if let Some(uid) = universe_id {
        let url_universe = format!("https://games.roblox.com/v1/games?universeIds={}", uid);
        let resp_raw = cliente.get(&url_universe)
            .header("User-Agent", "MultiRobloxManager/1.0")
            .send()
            .await
            .map_err(|e| e.to_string())?;
        let status = resp_raw.status();
        let resp: serde_json::Value = resp_raw.json().await.map_err(|e| e.to_string())?;

        if let Some(data) = resp["data"].as_array() {
            if let Some(first) = data.first() {
                if let Some(name) = first["name"].as_str() {
                    #[cfg(debug_assertions)]
                    println!("[DEBUG] Nome do jogo (universe {}) resolvido: {}", uid, name);
                    return Ok(name.to_string());
                }
            }
        }

        #[cfg(debug_assertions)]
        println!("[DEBUG] Falha ao obter nome via universeId (status: {:?}) uid {} resp {:?}", status, uid, resp);
    }

    // 2) Fallback via placeId multiget-place-details (pode exigir cookie; usamos só se universe faltou ou falhou)
    let url_place = format!("https://games.roblox.com/v1/games/multiget-place-details?placeIds={}", place_id);
    let resp_raw = cliente.get(&url_place)
        .header("User-Agent", "MultiRobloxManager/1.0")
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let status = resp_raw.status();
    let resp: serde_json::Value = resp_raw.json().await.map_err(|e| e.to_string())?;

    if let Some(data) = resp.as_array() {
        if let Some(first) = data.first() {
            if let Some(name) = first["name"].as_str() {
                #[cfg(debug_assertions)]
                println!("[DEBUG] Nome do jogo (place {}) resolvido: {}", place_id, name);
                return Ok(name.to_string());
            }
        }
    }

    #[cfg(debug_assertions)]
    println!("[DEBUG] Falha ao obter nome (status: {:?}) place {} resp {:?}", status, place_id, resp);

    Ok(format!("Place #{}", place_id))
}

/// Lista todas as instâncias do Roblox atualmente em execução
#[tauri::command]
async fn listar_instancias(
    mapa_state: State<'_, MapaPidsContas>,
    cache_state: State<'_, CacheJogos>,
) -> Result<Vec<InfoInstancia>, String> {
    let mut sistema = System::new_all();
    sistema.refresh_all();
    
    let dirs_logs = construir_dirs_logs(processo_exemplo_exe().as_ref());
    let mapeamento_logs = obter_mapeamento_jogos_logs(&dirs_logs);
    {
        // Sincroniza o mapa em memória com o arquivo compartilhado, permitindo ver contas de outras instâncias do app
        let persistido = ler_mapa_pids_compartilhado();
        let mut mapa = mapa_state.0.lock().unwrap_or_else(|e| e.into_inner());
        for (pid, info) in persistido {
            mapa.insert(pid, info);
        }
    }
    
    // 1. Coleta informações básicas segurando o lock do mapa de PIDs por pouco tempo
    let mut instancias: Vec<InfoInstancia> = {
        let mapa = mapa_state.0.lock().unwrap_or_else(|e| e.into_inner());
        sistema
            .processes()
            .values()
            .filter(|processo| {
                let nome = processo.name().to_string_lossy().to_lowercase();
                nome.contains("robloxplayerbeta") || nome.contains("robloxplayer")
            })
            .map(|processo| {
                let pid = processo.pid().as_u32();
                let info_proc = mapa.get(&pid);
                let c_id = info_proc.map(|i| i.conta_id.clone());
                let u_id_conta = info_proc.and_then(|i| i.user_id);
                
                let mut p_id = None;
                let mut u_id = None;
                let versao_cliente = processo
                    .exe()
                    .and_then(|p| p.parent())
                    .and_then(|p| p.file_name())
                    .and_then(|n| n.to_str())
                    .map(|s| s.to_string());
                
                // Debug: imprime argumentos do processo uma vez por PID
                #[cfg(debug_assertions)]
                {
                    let args_dbg: Vec<String> = processo.cmd().iter().map(|s| s.to_string_lossy().to_string()).collect();
                    println!("[DEBUG] PID {} args: {:?}", pid, args_dbg);
                }

                if let Some(user_id_num) = u_id_conta {
                    if let Some(info) = mapeamento_logs.get(&user_id_num) {
                        p_id = Some(info.place_id);
                        u_id = Some(info.universe_id);
                    }
                }

                // Fallback: tenta extrair placeId dos argumentos do processo
                if p_id.is_none() {
                    let args: Vec<String> = processo.cmd().iter().map(|s| s.to_string_lossy().to_string()).collect();
                    p_id = extrair_place_id_cmd(&args);
                    #[cfg(debug_assertions)]
                    println!("[DEBUG] PID {} placeId via args: {:?}", pid, p_id);
                }

                let job_id_proc = {
                    let args: Vec<String> = processo.cmd().iter().map(|s| s.to_string_lossy().to_string()).collect();
                    extrair_job_id_cmd(&args)
                };

                InfoInstancia {
                    pid,
                    nome_processo: processo.name().to_string_lossy().to_string(),
                    tempo_iniciado_secs: processo.start_time(),
                    conta_id: c_id,
                    place_id: p_id,
                    universe_id: u_id,
                    nome_jogo: None,
                    versao: versao_cliente,
                    caminho_cliente: processo.exe().map(|p| p.to_string_lossy().to_string()),
                    job_id: job_id_proc,
                }
            })
            .collect()
    };

    // Ordenação estável
    instancias.sort_by(|a, b| a.tempo_iniciado_secs.cmp(&b.tempo_iniciado_secs).then(a.pid.cmp(&b.pid)));

    // 2. Preenche nomes dos jogos sem segurar o lock do cache durante o await
    for inst in &mut instancias {
        if let Some(pid) = inst.place_id {
            // Verifica no cache primeiro
            let nome_cache = {
                let cache = cache_state.0.lock().unwrap_or_else(|e| e.into_inner());
                cache.get(&pid).cloned()
            };

            if let Some(nome) = nome_cache {
                inst.nome_jogo = Some(nome);
            } else {
                // Busca fora do lock
                if let Ok(nome_res) = buscar_nome_jogo(pid, inst.universe_id).await {
                    inst.nome_jogo = Some(nome_res.clone());
                    // Atualiza o cache (novo lock)
                    let mut cache = cache_state.0.lock().unwrap_or_else(|e| e.into_inner());
                    cache.insert(pid, nome_res);
                }
            }
        }
    }

    Ok(instancias)
}

/// Encerra uma instância do Roblox pelo PID
#[tauri::command]
async fn fechar_instancia(pid: u32, mapa_state: State<'_, MapaPidsContas>) -> Result<(), String> {
    let mut sistema = System::new_all();
    sistema.refresh_all();

    let pid_sysinfo = sysinfo::Pid::from_u32(pid);

    if let Some(processo) = sistema.process(pid_sysinfo) {
        processo.kill();
        // Remove mapeamento compartilhado
        {
            let mut mapa = mapa_state.0.lock().unwrap_or_else(|e| e.into_inner());
            mapa.remove(&pid);
            salvar_mapa_pids_compartilhado(&mapa);
        }
        Ok(())
    } else {
        Err(format!("Processo com PID {} não encontrado.", pid))
    }
}

/// Busca informações de um usuário Roblox pelo nome de usuário
#[tauri::command]
/// Busca o perfil completo de um usuário pelo ID
async fn obter_perfil_por_id(user_id: u64) -> Result<InfoUsuarioRoblox, String> {
    let cliente = reqwest::Client::builder()
        .user_agent("MultiRobloxManager/1.0")
        .build()
        .map_err(|e| format!("Erro ao criar cliente HTTP: {}", e))?;

    // 1. Busca detalhes básicos (nome, nome_display, descrição)
    // Nota: O endpoint de "authenticated" já deu o ID, mas para pegar descrição precisamos de outro se quisermos.
    // Para simplificar agora, vamos usar o endpoint de thumb e assumir o resto ou buscar via /v1/users/{userId}
    let url_info = format!("https://users.roblox.com/v1/users/{}", user_id);
    let resposta_info: serde_json::Value = cliente
        .get(&url_info)
        .send()
        .await
        .map_err(|e| format!("Erro ao buscar info do usuário: {}", e))?
        .json()
        .await
        .map_err(|e| format!("Erro ao processar info do usuário: {}", e))?;

    let nome = resposta_info["name"].as_str().unwrap_or("Desconhecido").to_string();
    let nome_display = resposta_info["displayName"].as_str().unwrap_or(&nome).to_string();
    let descricao = resposta_info["description"].as_str().unwrap_or_default().to_string();

    // 2. Busca o avatar do usuário
    let url_avatar = format!(
        "https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds={}&size=420x420&format=Png&isCircular=true",
        user_id
    );

    let resposta_avatar: RespostaAvatarRoblox = cliente
        .get(&url_avatar)
        .send()
        .await
        .map_err(|e| format!("Erro ao buscar avatar: {}", e))?
        .json()
        .await
        .map_err(|e| format!("Erro ao processar avatar: {}", e))?;

    let url_imagem_avatar = resposta_avatar
        .data
        .into_iter()
        .next()
        .and_then(|d| d.image_url)
        .unwrap_or_else(|| "https://tr.rbxcdn.com/placeholder.png".to_string());

    Ok(InfoUsuarioRoblox {
        id: user_id,
        nome,
        nome_display,
        avatar_url: url_imagem_avatar,
        descricao,
        e_premium: false,
    })
}

/// Busca um usuário do Roblox pelo nome para exibição no app
#[tauri::command]
async fn buscar_usuario_roblox(nome_usuario: String) -> Result<InfoUsuarioRoblox, String> {
    let cliente = reqwest::Client::builder()
        .user_agent("MultiRobloxManager/1.0")
        .build()
        .map_err(|e| format!("Erro ao criar cliente HTTP: {}", e))?;

    // Busca o usuário por nome para obter o ID
    let url_busca = "https://users.roblox.com/v1/usernames/users";
    let corpo = serde_json::json!({
        "usernames": [nome_usuario],
        "excludeBannedUsers": false
    });

    let resposta_usuario: RespostaUsuarioRoblox = cliente
        .post(url_busca)
        .json(&corpo)
        .send()
        .await
        .map_err(|e| format!("Erro de rede: {}", e))?
        .json()
        .await
        .map_err(|e| format!("Erro ao processar resposta: {}", e))?;

    let dados_usuario = resposta_usuario
        .data
        .into_iter()
        .next()
        .ok_or_else(|| format!("Usuário '{}' não encontrado.", nome_usuario))?;

    obter_perfil_por_id(dados_usuario.id).await
}

/// Gera um ticket de autenticação usando o cookie .ROBLOSECURITY
#[tauri::command]
async fn gerar_ticket_autenticacao(cookie: String) -> Result<String, String> {
    let cliente = reqwest::Client::new();
    
    // Formata o cookie se necessário
    let cookie_formatado = if cookie.starts_with(".ROBLOSECURITY=") {
        cookie.clone()
    } else {
        format!(".ROBLOSECURITY={}", cookie)
    };

    // 1. Tentar obter o ticket (precisamos do CSRF token primeiro se falhar)
    println!("[DEBUG] Solicitando ticket de autenticação...");
    let mut resposta = cliente
        .post("https://auth.roblox.com/v1/authentication-ticket")
        .header("Cookie", &cookie_formatado)
        .header("Referer", "https://www.roblox.com/games/1")
        .header("Content-Type", "application/json")
        .body("{}")
        .send()
        .await
        .map_err(|e| format!("Erro na requisição de ticket: {}", e))?;

    println!("[DEBUG] Resposta inicial: {}", resposta.status());

    // 2. Se retornar 403, pegamos o token CSRF e tentamos de novo
    if resposta.status() == 403 {
        if let Some(csrf_token) = resposta.headers().get("x-csrf-token") {
            println!("[DEBUG] CSRF detectado, tentando novamente...");
            resposta = cliente
                .post("https://auth.roblox.com/v1/authentication-ticket")
                .header("Cookie", &cookie_formatado)
                .header("Referer", "https://www.roblox.com/games/1")
                .header("x-csrf-token", csrf_token)
                .header("Content-Type", "application/json")
                .header("User-Agent", "Roblox/WinInet")
                .body("{}")
                .send()
                .await
                .map_err(|e| format!("Erro na requisição com CSRF: {}", e))?;
            println!("[DEBUG] Resposta após CSRF: {}", resposta.status());
        }
    }

    if !resposta.status().is_success() {
        println!("[DEBUG] Falha ao obter ticket. Status: {}", resposta.status());
        return Err(format!("Falha ao obter ticket: Status {}", resposta.status()));
    }

    // O ticket vem no header 'rbx-authentication-ticket'
    if let Some(ticket) = resposta.headers().get("rbx-authentication-ticket") {
        let ticket_str = ticket.to_str().unwrap_or_default().to_string();
        println!("[DEBUG] Ticket gerado com sucesso (finaliza em ...{})", &ticket_str[ticket_str.len().saturating_sub(5)..]);
        Ok(ticket_str)
    } else {
        println!("[DEBUG] Ticket não encontrado nos headers. Headers: {:?}", resposta.headers());
        Err("Ticket não encontrado nos headers da resposta.".to_string())
    }
}

/// Obtém o usuário autenticado via cookie
#[tauri::command]
async fn obter_usuario_por_cookie(cookie: String) -> Result<InfoUsuarioRoblox, String> {
    let cliente = reqwest::Client::new();
    let cookie_formatado = if cookie.starts_with(".ROBLOSECURITY=") {
        cookie.clone()
    } else {
        format!(".ROBLOSECURITY={}", cookie)
    };

    let resposta = cliente
        .get("https://users.roblox.com/v1/users/authenticated")
        .header("Cookie", &cookie_formatado)
        .send()
        .await
        .map_err(|e| format!("Erro ao validar cookie: {}", e))?;

    if !resposta.status().is_success() {
        return Err("Cookie inválido ou expirado.".to_string());
    }

    let dados: serde_json::Value = resposta
        .json()
        .await
        .map_err(|e| format!("Erro ao processar JSON: {}", e))?;

    let user_id = dados["id"].as_u64().ok_or("ID de usuário não encontrado")?;
    
    // Agora busca o perfil completo usando o ID
    obter_perfil_por_id(user_id).await
}

/// Abre uma janela do navegador interno para login no Roblox com diretório de dados isolado
#[tauri::command]
async fn abrir_janela_login(app_handle: tauri::AppHandle) -> Result<(), String> {
    // Diretório de dados isolado para que o lock do SQLite seja liberado ao fechar a janela
    let login_data_dir = app_handle.path().app_local_data_dir()
        .map_err(|e| format!("Erro ao obter diretório: {}", e))?
        .join("login_session");

    let _window = tauri::WebviewWindowBuilder::new(
        &app_handle,
        "login_roblox",
        tauri::WebviewUrl::External("https://www.roblox.com/login".parse().unwrap())
    )
    .title("Login Roblox - Dragon Manager")
    .inner_size(500.0, 700.0)
    .resizable(true)
    .always_on_top(true)
    .data_directory(login_data_dir)
    .build()
    .map_err(|e| format!("Erro ao abrir janela de login: {}", e))?;

    Ok(())
}

/// Captura o cookie .ROBLOSECURITY do diretório isolado da janela de login (após fechar a janela)
#[tauri::command]
async fn capturar_cookie_app(app_handle: tauri::AppHandle) -> Result<String, String> {
    let login_data_dir = app_handle.path().app_local_data_dir()
        .map_err(|e| format!("Erro ao obter diretório de dados: {}", e))?
        .join("login_session");

    let db_path = login_data_dir.join("EBWebView").join("Default").join("Network").join("Cookies");
    let local_state_path = login_data_dir.join("EBWebView").join("Local State");

    if !db_path.exists() {
        return Err("Sessão de login não encontrada. Clique em 'Abrir Janela', faça o login e feche a janela antes de capturar.".to_string());
    }

    println!("[DEBUG] db_path: {:?}, local_state: {:?}", db_path, local_state_path);

    // Lê a chave AES do Local State (protegida por DPAPI)
    let chave_aes: Option<Vec<u8>> = if local_state_path.exists() {
        let conteudo = std::fs::read_to_string(&local_state_path)
            .map_err(|e| format!("Erro ao ler Local State: {}", e))?;
        let json: serde_json::Value = serde_json::from_str(&conteudo)
            .map_err(|e| format!("Erro ao parsear Local State: {}", e))?;

        if let Some(chave_b64) = json["os_crypt"]["encrypted_key"].as_str() {
            use base64::Engine;
            let chave_bytes = base64::engine::general_purpose::STANDARD
                .decode(chave_b64)
                .map_err(|e| format!("Erro ao decodificar chave: {}", e))?;

            // Os primeiros 5 bytes são o prefixo "DPAPI"
            if chave_bytes.len() > 5 && chave_bytes.starts_with(b"DPAPI") {
                let dados_dpapi = &chave_bytes[5..];

                #[cfg(windows)]
                {
                    use winapi::um::dpapi::CryptUnprotectData;
                    use winapi::um::wincrypt::DATA_BLOB;
                    use winapi::um::winbase::LocalFree;
                    use std::ptr;

                    let mut entrada = DATA_BLOB {
                        cbData: dados_dpapi.len() as u32,
                        pbData: dados_dpapi.as_ptr() as *mut u8,
                    };
                    let mut saida = DATA_BLOB { cbData: 0, pbData: ptr::null_mut() };

                    let ok = unsafe {
                        CryptUnprotectData(&mut entrada, ptr::null_mut(), ptr::null_mut(),
                            ptr::null_mut(), ptr::null_mut(), 0, &mut saida)
                    };

                    if ok != 0 && !saida.pbData.is_null() {
                        let chave = unsafe {
                            std::slice::from_raw_parts(saida.pbData, saida.cbData as usize).to_vec()
                        };
                        unsafe { LocalFree(saida.pbData as *mut _) };
                        Some(chave)
                    } else {
                        println!("[DEBUG] DPAPI failed to decrypt AES key");
                        None
                    }
                }
                #[cfg(not(windows))]
                { None }
            } else { None }
        } else { None }
    } else { None };

    let db_path_clone = db_path.clone();
    let cookie_valor = tokio::task::spawn_blocking(move || -> Result<String, String> {
        let conn = rusqlite::Connection::open_with_flags(
            &db_path_clone,
            rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY | rusqlite::OpenFlags::SQLITE_OPEN_NO_MUTEX,
        ).map_err(|e| format!("Erro ao abrir banco SQLite: {}", e))?;

        let mut stmt = conn.prepare(
            "SELECT name, value, encrypted_value FROM cookies WHERE host_key LIKE '%roblox.com%'"
        ).map_err(|e| format!("Erro ao preparar consulta: {}", e))?;

        let rows = stmt.query_map([], |row| {
            let nome: String = row.get(0)?;
            let valor_texto: String = row.get(1).unwrap_or_default();
            let valor_enc: Vec<u8> = row.get(2).unwrap_or_default();
            Ok((nome, valor_texto, valor_enc))
        }).map_err(|e| format!("Erro ao consultar cookies: {}", e))?;

        for row in rows {
            let (nome, valor_texto, valor_enc) = row.map_err(|e| e.to_string())?;
            if nome != ".ROBLOSECURITY" { continue; }

            // Valor em texto plano (não criptografado)
            if !valor_texto.is_empty() {
                return Ok(format!(".ROBLOSECURITY={}", valor_texto));
            }

            if valor_enc.is_empty() { continue; }

            // Cookie v10/v11 = AES-256-GCM (Chromium/WebView2)
            if (valor_enc.starts_with(b"v10") || valor_enc.starts_with(b"v11")) {
                if let Some(ref chave) = chave_aes {
                    use aes_gcm::{Aes256Gcm, Key, Nonce};
                    use aes_gcm::aead::Aead;
                    use aes_gcm::KeyInit;

                    if chave.len() != 32 {
                        println!("[DEBUG] Chave AES tem tamanho inválido: {}", chave.len());
                        continue;
                    }

                    // Estrutura: [3 bytes prefixo v10] [12 bytes nonce] [ciphertext + 16 bytes tag]
                    if valor_enc.len() < 3 + 12 + 1 { continue; }
                    let nonce_bytes = &valor_enc[3..15];
                    let ciphertext = &valor_enc[15..];

                    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(chave));
                    let nonce = Nonce::from_slice(nonce_bytes);

                    match cipher.decrypt(nonce, ciphertext) {
                        Ok(plaintext) => {
                            // Converte o plaintext para string, substituindo bytes inválidos
                            let texto_bruto = String::from_utf8_lossy(&plaintext);
                            
                            println!("[DEBUG] Cookie AES bruto (primeiros 40): {:?}", 
                                &texto_bruto[..texto_bruto.len().min(40)]);
                            
                            // O WebView2 pode adicionar bytes de prefixo antes do valor real
                            // O cookie .ROBLOSECURITY do Roblox começa com "_|WARNING:" ou "_|"
                            let inicio = texto_bruto.find("_|")
                                .or_else(|| texto_bruto.find("WARNING"));
                            
                            let valor_cookie = if let Some(pos) = inicio {
                                // Extrai a partir do início real do cookie
                                texto_bruto[pos..].trim().to_string()
                            } else {
                                // Fallback: usa o texto inteiro filtrando caracteres inválidos
                                texto_bruto.chars()
                                    .filter(|c| c.is_ascii_graphic() || *c == ' ')
                                    .collect::<String>()
                                    .trim()
                                    .to_string()
                            };
                            
                            println!("[DEBUG] Cookie extraído (len={}): {}...", 
                                valor_cookie.len(), &valor_cookie[..valor_cookie.len().min(30)]);
                            
                            if valor_cookie.len() > 10 {
                                return Ok(format!(".ROBLOSECURITY={}", valor_cookie));
                            }
                        }
                        Err(e) => {
                            println!("[DEBUG] AES-GCM decrypt falhou: {:?}", e);
                        }
                    }
                } else {
                    println!("[DEBUG] Sem chave AES para decriptar cookie v10");
                }
            }

            // Fallback: DPAPI puro (cookies sem prefixo v10)
            #[cfg(windows)]
            {
                use winapi::um::dpapi::CryptUnprotectData;
                use winapi::um::wincrypt::DATA_BLOB;
                use winapi::um::winbase::LocalFree;
                use std::ptr;

                let mut entrada = DATA_BLOB {
                    cbData: valor_enc.len() as u32,
                    pbData: valor_enc.as_ptr() as *mut u8,
                };
                let mut saida = DATA_BLOB { cbData: 0, pbData: ptr::null_mut() };

                let ok = unsafe {
                    CryptUnprotectData(&mut entrada, ptr::null_mut(), ptr::null_mut(),
                        ptr::null_mut(), ptr::null_mut(), 0, &mut saida)
                };

                if ok != 0 && !saida.pbData.is_null() {
                    let bytes = unsafe {
                        std::slice::from_raw_parts(saida.pbData, saida.cbData as usize)
                    };
                    let texto = String::from_utf8_lossy(bytes).to_string();
                    unsafe { LocalFree(saida.pbData as *mut _) };
                    return Ok(format!(".ROBLOSECURITY={}", texto));
                }
            }
        }

        Err("Cookie .ROBLOSECURITY não encontrado após decriptação. Tente fazer o login novamente e fechar a janela antes de capturar.".to_string())
    }).await.map_err(|e| format!("Erro interno: {}", e))??;

    Ok(cookie_valor)
}


// ─────────────────────────────────────────────
// Persistência Local (Banco de Dados JSON)
// ─────────────────────────────────────────────

fn obter_caminho_banco(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let path = app_handle.path().app_data_dir()
        .map_err(|e| format!("Erro ao obter diretório de dados: {}", e))?;
    
    if !path.exists() {
        fs::create_dir_all(&path).map_err(|e| format!("Erro ao criar diretório de dados: {}", e))?;
    }
    
    Ok(path.join("contas.json"))
}

#[tauri::command]
async fn carregar_contas_local(app_handle: tauri::AppHandle) -> Result<Vec<ContaSalva>, String> {
    let caminho = obter_caminho_banco(&app_handle)?;
    
    if !caminho.exists() {
        return Ok(Vec::new());
    }
    
    let conteudo = fs::read_to_string(caminho).map_err(|e| format!("Erro ao ler arquivo de contas: {}", e))?;
    let contas: Vec<ContaSalva> = serde_json::from_str(&conteudo).map_err(|e| format!("Erro ao processar JSON de contas: {}", e))?;
    
    Ok(contas)
}

#[tauri::command]
async fn salvar_contas_local(app_handle: tauri::AppHandle, contas: Vec<ContaSalva>) -> Result<(), String> {
    let caminho = obter_caminho_banco(&app_handle)?;
    
    let conteudo = serde_json::to_string_pretty(&contas).map_err(|e| format!("Erro ao serializar contas: {}", e))?;
    fs::write(caminho, conteudo).map_err(|e| format!("Erro ao salvar arquivo de contas: {}", e))?;
    
    Ok(())
}

/// Verifica se o processo atual tem privilégios de administrador
fn e_administrador() -> bool {
    #[cfg(windows)]
    {
        use std::ptr;
        use winapi::um::processthreadsapi::{GetCurrentProcess, OpenProcessToken};
        use winapi::um::securitybaseapi::GetTokenInformation;
        use winapi::um::winnt::{TokenElevation, TOKEN_ELEVATION, TOKEN_QUERY};

        let mut token: *mut winapi::ctypes::c_void = ptr::null_mut();
        unsafe {
            if OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &mut token) != 0 {
                let elevation: TOKEN_ELEVATION = std::mem::zeroed();
                let mut len = std::mem::size_of::<TOKEN_ELEVATION>() as u32;
                if GetTokenInformation(
                    token,
                    TokenElevation,
                    &elevation as *const _ as *mut _,
                    len,
                    &mut len,
                ) != 0
                {
                    return elevation.TokenIsElevated != 0;
                }
            }
        }
        false
    }
    #[cfg(not(windows))]
    {
        true // Ignora em outros sistemas por enquanto
    }
}

/// Reinicia o aplicativo solicitando privilégios de administrador
#[tauri::command]
async fn solicitar_elevacao_uac() -> Result<(), String> {
    #[cfg(windows)]
    {
        let exe_path = std::env::current_exe()
            .map_err(|e| format!("Erro ao obter caminho do executável: {}", e))?;
        
        let path_str = exe_path.to_str().ok_or("Caminho inválido")?;
        
        // Usa PowerShell para iniciar como admin sem mostrar janela de console
        let status = std::process::Command::new("powershell")
            .arg("-WindowStyle")
            .arg("Hidden")
            .arg("-Command")
            .arg(format!("Start-Process -FilePath '{}' -Verb RunAs", path_str))
            .status()
            .map_err(|e| format!("Erro ao executar PowerShell: {}", e))?;

        if status.success() {
            std::process::exit(0);
        } else {
            return Err("O usuário recusou a permissão de administrador.".to_string());
        }
    }
    #[cfg(not(windows))]
    Ok(())
}

/// Escaneia navegadores instalados em busca de cookies do Roblox
#[tauri::command]
async fn importar_contas_navegador() -> Result<Vec<ContaImportada>, String> {
    // Se não for admin, retornamos um erro especial para o frontend
    if !e_administrador() {
        return Err("NEED_ADMIN".to_string());
    }

    let mut contas_encontradas = Vec::new();
    let mut cookies_unicos = std::collections::HashSet::new();

    // Lista de fontes de cookies
    let mut todas_as_fontes = Vec::new();

    // 1. Tenta carregar de todos os browsers suportados automaticamente
    if let Ok(cookies) = rookie::load(None) {
        todas_as_fontes.extend(cookies);
    }

    // 2. Tenta carregar do Brave explicitamente (caso o load geral falhe em detectá-lo)
    if let Ok(cookies) = rookie::brave(None) {
        todas_as_fontes.extend(cookies);
    }

    // 3. Tenta carregar do Comet (Chromium-based customizado)
    if let Ok(local_appdata) = std::env::var("LOCALAPPDATA") {
        let base_comet = std::path::PathBuf::from(local_appdata).join("Perplexity").join("Comet").join("User Data");
        let key_path = base_comet.join("Local State");

        if key_path.exists() {
            println!("[DEBUG] Pasta User Data do Comet encontrada em: {:?}", base_comet);
            // Lista diretórios para encontrar perfis (Default, Profile X, etc)
            if let Ok(entradas) = std::fs::read_dir(&base_comet) {
                for entrada in entradas.flatten() {
                    let path = entrada.path();
                    // Um perfil real geralmente tem um arquivo "Preferences"
                    if path.is_dir() && path.join("Preferences").exists() {
                        let caminhos_db = vec![
                            path.join("Network").join("Cookies"),
                            path.join("Cookies"),
                        ];

                        for db_path in caminhos_db {
                            if db_path.exists() {
                                println!("[DEBUG] Perfil detectado: {:?}", path.file_name());
                                match rookie::chromium_based(key_path.clone(), db_path, None) {
                                    Ok(cookies) => {
                                        println!("[DEBUG] Sucesso: {} cookies extraídos.", cookies.len());
                                        todas_as_fontes.extend(cookies);
                                    }
                                    Err(e) => {
                                        println!("[DEBUG] Erro no perfil {:?}: {}", path.file_name(), e);
                                        if e.to_string().contains("decrypt") {
                                            println!("[DEBUG] DICA: Tente fechar o navegador Comet e rodar o app como Administrador.");
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else {
            println!("[DEBUG] Arquivo Local State do Comet não encontrado em: {:?}", key_path);
        }
    }

    println!("[DEBUG] Total de cookies coletados de todas as fontes: {}", todas_as_fontes.len());

    for cookie in todas_as_fontes {
        // Filtro mais robusto: qualquer coisa que contenha roblox.com
        if cookie.domain.contains("roblox.com") && cookie.name == ".ROBLOSECURITY" {
            println!("[DEBUG] Cookie .ROBLOSECURITY encontrado para o domínio: {}", cookie.domain);
            let valor = if cookie.value.starts_with(".ROBLOSECURITY=") {
                cookie.value.clone()
            } else {
                format!(".ROBLOSECURITY={}", cookie.value)
            };
            
            // Evita duplicatas
            if cookies_unicos.contains(&valor) {
                continue;
            }
            
            // Valida o cookie e tenta obter o perfil
            match obter_usuario_por_cookie(valor.clone()).await {
                Ok(perfil) => {
                    println!("[DEBUG] Usuário validado: {}", perfil.nome_display);
                    contas_encontradas.push(ContaImportada {
                        perfil,
                        cookie: valor.clone(),
                    });
                    cookies_unicos.insert(valor);
                }
                Err(e) => println!("[DEBUG] Falha ao validar cookie no Roblox: {}", e),
            }
        }
    }

    if contas_encontradas.is_empty() {
        return Err("Nenhuma sessão ativa encontrada nos navegadores (Chrome, Edge, Firefox, Brave ou Comet).".to_string());
    }

    Ok(contas_encontradas)
}

/// Verifica se há clientes do Roblox instalados e retorna a lista
#[tauri::command]
async fn verificar_roblox_instalado() -> Vec<ClienteRoblox> {
    obter_clientes_roblox()
}

#[tauri::command]
async fn listar_clientes_disponiveis() -> Result<Vec<ClienteRoblox>, String> {
    Ok(obter_clientes_roblox())
}

#[tauri::command]
async fn obter_favoritos_locais(app_handle: tauri::AppHandle) -> Result<Vec<InfoJogoRoblox>, String> {
    use tauri::Manager;
    let local_data = app_handle.path().app_local_data_dir().map_err(|e| format!("Erro no diretório: {}", e))?;
    let fav_path = local_data.join("favoritos_jogos.json");
    
    if !fav_path.exists() {
        return Ok(Vec::new());
    }
    
    let conteudo = std::fs::read_to_string(&fav_path).map_err(|e| format!("Erro ao ler favoritos: {}", e))?;
    let favoritos: Vec<InfoJogoRoblox> = serde_json::from_str(&conteudo).unwrap_or_default();
    Ok(favoritos)
}

#[tauri::command]
async fn salvar_favoritos_locais(app_handle: tauri::AppHandle, favoritos: Vec<InfoJogoRoblox>) -> Result<(), String> {
    use tauri::Manager;
    let local_data = app_handle.path().app_local_data_dir().map_err(|e| format!("Erro no diretório: {}", e))?;
    std::fs::create_dir_all(&local_data).map_err(|e| format!("Erro ao criar dir: {}", e))?;
    let fav_path = local_data.join("favoritos_jogos.json");
    
    let json = serde_json::to_string(&favoritos).map_err(|e| format!("Erro de serializer: {}", e))?;
    std::fs::write(&fav_path, json).map_err(|e| format!("Erro ao salvar arquivo: {}", e))?;
    
    Ok(())
}

#[tauri::command]
async fn buscar_jogos_roblox(
    termo: String,
    cursor: Option<String>,
    app_handle: tauri::AppHandle,
) -> Result<RespostaBuscaJogos, String> {
    let cliente = reqwest::Client::new();
    let session_id = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis().to_string();
    
    let use_explore = termo.trim().is_empty();
    let mut url = if use_explore {
        format!("https://apis.roblox.com/explore-api/v1/get-sorts?sessionId={}", session_id)
    } else {
        format!("https://apis.roblox.com/search-api/omni-search?searchQuery={}&sessionId={}&pageType=all", termo.trim(), session_id)
    };
    
    if !use_explore {
        if let Some(c) = &cursor {
            url = format!("{}&pageToken={}", url, c);
        }
    }
    
    let resposta: serde_json::Value = cliente
        .get(&url)
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .send()
        .await
        .map_err(|e| format!("Falha request: {}", e))?
        .json()
        .await
        .map_err(|e| format!("Falha json parse: {}", e))?;
        
    let mut jogos = Vec::new();
    let mut universe_ids = Vec::new();
    let mut next_cursor = None;
    
    if use_explore {
        if let Some(sorts) = resposta["sorts"].as_array() {
            let sort_index = if sorts.len() > 1 { 1 } else { 0 }; 
            if let Some(sort) = sorts.get(sort_index) {
                if let Some(games_arr) = sort["games"].as_array() {
                    for g in games_arr {
                        let universe_id = g["universeId"].as_u64().unwrap_or(0);
                        universe_ids.push(universe_id);
                        jogos.push(InfoJogoRoblox {
                            place_id: g["rootPlaceId"].as_u64().unwrap_or(0),
                            universe_id,
                            nome: g["name"].as_str().unwrap_or("Desconhecido").to_string(),
                            descricao: g["description"].as_str().unwrap_or("").to_string(),
                            thumbnail_url: None,
                            jogadores_ativos: g["playerCount"].as_u64(),
                            criador_nome: g["creatorName"].as_str().map(|s| s.to_string()),
                            curtidas: g["totalUpVotes"].as_u64(),
                            favorito_local: Some(false),
                        });
                    }
                }
            }
        }
    } else {
        if let Some(results) = resposta["searchResults"].as_array() {
            if let Some(game_group) = results.iter().find(|r| r["contentGroupType"] == "Game") {
                if let Some(contents) = game_group["contents"].as_array() {
                    for g in contents {
                        let universe_id = g["universeId"].as_u64().unwrap_or(0);
                        universe_ids.push(universe_id);
                        jogos.push(InfoJogoRoblox {
                            place_id: g["rootPlaceId"].as_u64().unwrap_or(0),
                            universe_id,
                            nome: g["name"].as_str().unwrap_or("Desconhecido").to_string(),
                            descricao: g["description"].as_str().unwrap_or("").to_string(),
                            thumbnail_url: None,
                            jogadores_ativos: g["playerCount"].as_u64(),
                            criador_nome: g["creatorName"].as_str().map(|s| s.to_string()),
                            curtidas: g["totalUpVotes"].as_u64(),
                            favorito_local: Some(false),
                        });
                    }
                }
            }
        }
        next_cursor = resposta["nextPageToken"].as_str().map(|s| s.to_string());
    }
    
    // Obter thumbnails e marcar favoritos se existirem localmente
    if !universe_ids.is_empty() {
        let uids_str: Vec<String> = universe_ids.iter().map(|u| u.to_string()).collect();
        let thumbs_url = format!(
            "https://thumbnails.roblox.com/v1/games/icons?universeIds={}&returnPolicy=PlaceHolder&size=150x150&format=Png&isCircular=false",
            uids_str.join(",")
        );
        
        if let Ok(thumb_res) = cliente.get(&thumbs_url).send().await {
            if let Ok(thumb_json) = thumb_res.json::<serde_json::Value>().await {
                if let Some(data) = thumb_json["data"].as_array() {
                    for thumb in data {
                        let target_id = thumb["targetId"].as_u64().unwrap_or(0);
                        let img_url = thumb["imageUrl"].as_str().unwrap_or("").to_string();
                        if let Some(jogo) = jogos.iter_mut().find(|j| j.universe_id == target_id) {
                            jogo.thumbnail_url = Some(img_url);
                        }
                    }
                }
            }
        }
    }
    
    // Marcar como favoritos os jogos que já estão
    if let Ok(favoritos) = obter_favoritos_locais(app_handle.clone()).await {
        for jogo in jogos.iter_mut() {
            if favoritos.iter().any(|f| f.universe_id == jogo.universe_id) {
                jogo.favorito_local = Some(true);
            }
        }
    }
    
    Ok(RespostaBuscaJogos {
        virgula_anterior: None, // a nova API omni search só retorna nextToken
        virgula_proxima: next_cursor,
        jogos,
    })
}

// ─────────────────────────────────────────────
// Entry point do app Tauri
// ─────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(mapa_pids_inicial())
        .manage(CacheJogos::default())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            lancar_roblox,
            listar_instancias,
            fechar_instancia,
            buscar_usuario_roblox,
            verificar_roblox_instalado,
            gerar_ticket_autenticacao,
            obter_usuario_por_cookie,
            importar_contas_navegador,
            solicitar_elevacao_uac,
            carregar_contas_local,
            salvar_contas_local,
            abrir_janela_login,
            capturar_cookie_app,
            listar_clientes_disponiveis,
            buscar_jogos_roblox,
            obter_favoritos_locais,
            salvar_favoritos_locais
        ])
        .run(tauri::generate_context!())
        .expect("Erro ao iniciar o MultiRoblox Manager");
}

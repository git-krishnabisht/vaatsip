use actix_web::{get, App, HttpServer, Responder, HttpResponse};
use serde::Serialize;
use sqlx::postgres::PgPoolOptions;
use std::env;
use dotenv::dotenv;

#[derive(Serialize)]
struct User {
    username: String,
    name: Option<String>,
    email: Option<String>,
    gender: Option<String>,
    dob: Option<String>,
    password: Option<String>,
}

#[get("/get-users")]
async fn get_users(db_pool: actix_web::web::Data<sqlx::PgPool>) -> impl Responder {
    let users = sqlx::query_as!(User, "SELECT username, name, email, gender, dob, password from users;")
        .fetch_all(db_pool.get_ref())
        .await;

    match users {
        Ok(u) => HttpResponse::Ok().json(u),
        Err(e) => {
            eprintln!("Database error: {}", e);
            HttpResponse::InternalServerError().body("Something went wrong")
        }
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    let db_url = env::var("DATABASE_URL").expect("DATABASE_URL not set in .env");

    let db_pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await
        .expect("Failed to connect to database");

    println!("Server running at http://localhost:8080");

    HttpServer::new(move || {
        App::new()
            .app_data(actix_web::web::Data::new(db_pool.clone()))
            .service(get_users)
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}

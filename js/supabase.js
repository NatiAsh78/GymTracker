const supabaseClient = window.supabase.createClient(
    CONFIG.supabaseUrl,
    CONFIG.supabaseKey
);

console.log("✅ Supabase client created");

async function testConnection() {

    const { data, error } = await supabaseClient
        .from("exercises")
        .select("*");

    if (error) {
        console.error(error);
        return;
    }

    console.log("🎉 Exercises loaded:");
    console.table(data);
}

testConnection();